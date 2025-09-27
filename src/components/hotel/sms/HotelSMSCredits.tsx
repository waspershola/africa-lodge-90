import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface SMSCredits {
  balance: number;
  total_purchased: number;
  total_used: number;
  last_topup_at: string;
}

interface CreditUsage {
  date: string;
  credits_used: number;
  purpose: string;
}

export function HotelSMSCredits() {
  const [credits, setCredits] = useState<SMSCredits | null>(null);
  const [recentUsage, setRecentUsage] = useState<CreditUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCreditsData();
  }, []);

  const fetchCreditsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Fetch SMS credits
      const { data: creditsData } = await supabase
        .from('sms_credits')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .single();

      setCredits(creditsData);

      // Fetch recent usage
      const { data: usageData } = await supabase
        .from('sms_logs')
        .select('created_at, credits_used, purpose')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedUsage = usageData?.map(log => ({
        date: log.created_at,
        credits_used: log.credits_used,
        purpose: log.purpose || 'SMS Sent'
      })) || [];

      setRecentUsage(formattedUsage);
    } catch (error) {
      console.error('Error fetching credits data:', error);
      toast({
        title: "Error",
        description: "Failed to load credits information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading credits information...</div>;
  }

  const usagePercentage = credits ? (credits.total_used / credits.total_purchased) * 100 : 0;
  const balanceStatus = credits?.balance > 100 ? 'good' : credits?.balance > 50 ? 'warning' : 'low';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">SMS Credits</h2>
        <p className="text-muted-foreground">Monitor your SMS credit usage and balance</p>
      </div>

      {!credits ? (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No SMS credits found</h3>
            <p className="text-muted-foreground">
              Contact your administrator to provision SMS credits
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Credits Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {credits.balance.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge 
                    variant={balanceStatus === 'good' ? 'default' : balanceStatus === 'warning' ? 'secondary' : 'destructive'}
                  >
                    {balanceStatus === 'good' ? 'Good' : balanceStatus === 'warning' ? 'Warning' : 'Low Balance'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {credits.total_purchased.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Credits purchased to date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Used</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {credits.total_used.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Credits consumed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage</CardTitle>
              <CardDescription>
                Overall credit consumption from your purchased credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Used: {credits.total_used.toLocaleString()}</span>
                  <span>Remaining: {credits.balance.toLocaleString()}</span>
                </div>
                <Progress value={Math.min(usagePercentage, 100)} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  {usagePercentage.toFixed(1)}% of purchased credits used
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Usage
              </CardTitle>
              <CardDescription>
                Latest SMS credit consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent credit usage
                  </p>
                ) : (
                  recentUsage.map((usage, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">{usage.purpose}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(usage.date).toLocaleDateString()} at{' '}
                          {new Date(usage.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          -{usage.credits_used} credit{usage.credits_used !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Credit Information */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Information</CardTitle>
              <CardDescription>
                Important details about your SMS credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Last Top-up</p>
                    <p className="text-sm text-muted-foreground">
                      {credits.last_topup_at 
                        ? new Date(credits.last_topup_at).toLocaleDateString()
                        : 'No top-ups yet'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Credit Status</p>
                    <Badge 
                      variant={balanceStatus === 'good' ? 'default' : balanceStatus === 'warning' ? 'secondary' : 'destructive'}
                    >
                      {balanceStatus === 'good' ? 'Sufficient' : balanceStatus === 'warning' ? 'Running Low' : 'Critical'}
                    </Badge>
                  </div>
                </div>
                
                {balanceStatus === 'low' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Your SMS credit balance is running low. Contact your administrator to add more credits.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}