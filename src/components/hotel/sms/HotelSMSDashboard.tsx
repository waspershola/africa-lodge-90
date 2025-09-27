import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, CreditCard, Clock, TrendingUp, Send, AlertCircle } from "lucide-react";

interface SMSStats {
  total_sent: number;
  total_failed: number;
  credits_remaining: number;
  templates_count: number;
  recent_activity: any[];
}

export function HotelSMSDashboard() {
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Fetch SMS logs for stats
      const { data: logs } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch SMS credits
      const { data: credits } = await supabase
        .from('sms_credits')
        .select('balance')
        .eq('tenant_id', userData.tenant_id)
        .single();

      // Fetch SMS templates count
      const { data: templates } = await supabase
        .from('sms_templates')
        .select('id')
        .eq('tenant_id', userData.tenant_id)
        .eq('is_active', true);

      const totalSent = logs?.filter(log => log.status === 'sent').length || 0;
      const totalFailed = logs?.filter(log => log.status === 'failed').length || 0;

      setStats({
        total_sent: totalSent,
        total_failed: totalFailed,
        credits_remaining: credits?.balance || 0,
        templates_count: templates?.length || 0,
        recent_activity: logs?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.total_sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.total_failed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.credits_remaining || 0}</div>
            <p className="text-xs text-muted-foreground">
              Credits remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.templates_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Templates configured
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SMS Activity</CardTitle>
          <CardDescription>
            Latest SMS messages sent from your hotel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recent_activity?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent SMS activity
              </p>
            ) : (
              stats?.recent_activity?.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.purpose || 'Manual SMS'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      To: {activity.recipient_phone} • {activity.credits_used} credit{activity.credits_used !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={activity.status === 'sent' ? 'default' : 'destructive'}>
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common SMS management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Create Template
            </Button>
            <Button variant="outline" className="justify-start">
              <CreditCard className="mr-2 h-4 w-4" />
              View Credit Usage
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              SMS Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}