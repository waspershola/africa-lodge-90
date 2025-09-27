import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, AlertTriangle, CheckCircle, Clock, Users, MessageSquare } from "lucide-react";

interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  pendingAlerts: number;
  subscribedChannels: number;
}

export function StaffAlertsDashboard() {
  const [stats, setStats] = useState<AlertStats>({
    totalAlerts: 0,
    activeAlerts: 0,
    pendingAlerts: 0,
    subscribedChannels: 0
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentAlerts();
  }, []);

  const fetchRecentAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { data, error } = await supabase
        .from('staff_alerts')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get channel count
      const { data: channels } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('is_enabled', true);

      const activeCount = data?.filter((alert: any) => alert.status === 'pending').length || 0;
      const resolvedCount = data?.filter((alert: any) => alert.status === 'resolved').length || 0;

      setStats({
        totalAlerts: data?.length || 0,
        activeAlerts: activeCount,
        pendingAlerts: activeCount,
        subscribedChannels: channels?.length || 0
      });
      
      setRecentAlerts(data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('staff_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) throw error;
      toast({ title: "Success", description: "Alert acknowledged" });
      fetchRecentAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading alert dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.activeAlerts}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pendingAlerts}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Channels</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribedChannels}</div>
            <p className="text-xs text-muted-foreground">Active channels</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Latest staff notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent alerts</h3>
                <p className="text-muted-foreground">
                  No staff alerts have been generated yet. Configure alert rules to start receiving notifications.
                </p>
              </div>
            ) : (
              recentAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          alert.priority === 'high' ? 'destructive' : 
                          alert.priority === 'medium' ? 'default' : 
                          'secondary'
                        }
                      >
                        {alert.priority || 'medium'}
                      </Badge>
                      <Badge variant="outline">
                        {alert.alert_type || 'system'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{alert.title || 'Staff Alert'}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.message?.substring(0, 100)}
                      {alert.message?.length > 100 ? '...' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        alert.status === 'resolved' ? 'default' : 
                        alert.status === 'acknowledged' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {alert.status || 'pending'}
                    </Badge>
                    {alert.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Types Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alert Types</CardTitle>
            <CardDescription>Types of alerts configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'Maintenance Required', icon: AlertTriangle, count: 0, color: 'text-orange-600' },
                { type: 'Guest Issues', icon: Users, count: 0, color: 'text-red-600' },
                { type: 'System Alerts', icon: Bell, count: 0, color: 'text-blue-600' },
                { type: 'Housekeeping', icon: Clock, count: 0, color: 'text-green-600' },
              ].map((alertType, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <alertType.icon className={`h-4 w-4 ${alertType.color}`} />
                    <span className="text-sm font-medium">{alertType.type}</span>
                  </div>
                  <Badge variant="outline">{alertType.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common alert management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="mr-2 h-4 w-4" />
                Create New Alert
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Configure Channels
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Subscriptions
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                View Alert History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}