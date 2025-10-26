import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, TrendingUp, Calendar, AlertTriangle } from "lucide-react";

interface CreditInfo {
  current_balance: number;
  daily_usage_avg: number;
  estimated_days_remaining: number;
  recommended_topup: number;
}

interface CreditHistory {
  id: string;
  credits_used: number;
  created_at: string;
  purpose: string;
  source_type: string;
}

export function HotelSMSCredits() {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Get credit usage forecast
      const { data: forecast } = await supabase
        .rpc('get_credit_usage_forecast', { p_tenant_id: userData.tenant_id });

      if (forecast && forecast.length > 0) {
        setCreditInfo(forecast[0]);
      }

      // Get credit history/logs
      const { data: history } = await supabase
        .from('sms_logs')
        .select('id, credits_used, created_at, purpose, source_type')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })
        .limit(20);

      setCreditHistory(history || []);
    } catch (error) {
      console.error('Error fetching credit data:', error);
      toast.error("Failed to load credit information");
    } finally {
      setLoading(false);
    }
  };

  const getBalanceStatus = () => {
    if (!creditInfo) return 'good';
    
    if (creditInfo.current_balance < 50) return 'critical';
    if (creditInfo.current_balance < 200) return 'warning';
    return 'good';
  };

  const getBalanceBadge = () => {
    const status = getBalanceStatus();
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical Low</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500">Low Balance</Badge>;
      default:
        return <Badge>Good</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center">Loading credit information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Credits</h2>
          <p className="text-muted-foreground">
            Monitor your SMS credit balance and usage patterns
          </p>
        </div>
        <Button>
          Request Top-up
        </Button>
      </div>

      {/* Credit Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {creditInfo?.current_balance || 0}
              </div>
              {getBalanceBadge()}
            </div>
            <p className="text-xs text-muted-foreground">
              SMS credits available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Daily Usage Avg
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(creditInfo?.daily_usage_avg || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits per day (30-day avg)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Days Remaining
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditInfo?.estimated_days_remaining || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              At current usage rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recommended Top-up
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditInfo?.recommended_topup || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              For next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      {creditInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage Analysis</CardTitle>
            <CardDescription>
              Track your credit consumption and optimize usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Balance Status</span>
                <span className="text-sm text-muted-foreground">
                  {creditInfo.current_balance} / {creditInfo.recommended_topup} credits
                </span>
              </div>
              <Progress 
                value={(creditInfo.current_balance / creditInfo.recommended_topup) * 100} 
                className="h-2"
              />
            </div>
            
            {creditInfo.estimated_days_remaining < 7 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-800">Low Credit Warning</p>
                    <p className="text-sm text-amber-700">
                      You have only {creditInfo.estimated_days_remaining} days of credits remaining. 
                      Consider requesting a top-up to avoid service interruption.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Credit Activity</CardTitle>
          <CardDescription>
            Latest SMS credit usage and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creditHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No credit activity found
              </p>
            ) : (
              creditHistory.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                  <div>
                    <p className="font-medium">
                      {activity.source_type === 'usage' ? 'SMS Sent' : 'Credit Added'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.purpose || 'General usage'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.source_type === 'usage' ? 'secondary' : 'default'}>
                      {activity.source_type === 'usage' ? '-' : '+'}{Math.abs(activity.credits_used)} credits
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}