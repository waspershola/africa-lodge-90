import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, AlertTriangle, CheckCircle, Clock, Users, MessageSquare } from "lucide-react";

interface AlertStats {
  total_alerts: number;
  pending_alerts: number;
  resolved_alerts: number;
  active_channels: number;
  staff_subscribed: number;
  recent_alerts: any[];
}

export function StaffAlertsDashboard() {
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlertStats();
  }, []);

  const fetchAlertStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Fetch staff alerts
      const { data: alerts } = await supabase
        .from('staff_alerts')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch staff alert subscriptions
      const { data: subscriptions } = await supabase
        .from('staff_alert_subscriptions')
        .select('user_id')
        .eq('tenant_id', userData.tenant_id)
        .eq('is_active', true);

      const totalAlerts = alerts?.length || 0;
      const pendingAlerts = alerts?.filter(alert => alert.status === 'pending').length || 0;
      const resolvedAlerts = alerts?.filter(alert => alert.status === 'resolved').length || 0;
      const uniqueStaff = new Set(subscriptions?.map(sub => sub.user_id) || []).size;

      setStats({
        total_alerts: totalAlerts,
        pending_alerts: pendingAlerts,
        resolved_alerts: resolvedAlerts,
        active_channels: 3, // SMS, Email, In-App
        staff_subscribed: uniqueStaff,
        recent_alerts: alerts?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error fetching alert stats:', error);
      toast({
        title: "Error",
        description: "Failed to load alert statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('staff_alerts')
        .update({ 
          status: 'acknowledged', 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Alert marked as acknowledged",
      });
      
      fetchAlertStats();
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert",
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_alerts || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.pending_alerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.resolved_alerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.active_channels || 0}
            </div>
            <p className="text-xs text-muted-foreground">Channels enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Subscribed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.staff_subscribed || 0}</div>
            <p className="text-xs text-muted-foreground">Staff members</p>
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
            {stats?.recent_alerts?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent alerts
              </p>
            ) : (
              stats?.recent_alerts?.map((alert, index) => (
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
                        onClick={() => markAlertAsRead(alert.id)}
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
                { type: 'Maintenance Required', icon: AlertTriangle, count: 5, color: 'text-orange-600' },
                { type: 'Guest Issues', icon: Users, count: 3, color: 'text-red-600' },
                { type: 'System Alerts', icon: Bell, count: 2, color: 'text-blue-600' },
                { type: 'Housekeeping', icon: Clock, count: 4, color: 'text-green-600' },
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