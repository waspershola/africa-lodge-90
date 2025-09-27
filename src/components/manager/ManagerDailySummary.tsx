import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Bed, 
  AlertTriangle, 
  TrendingUp,
  Mail,
  Download 
} from "lucide-react";

interface DailySummary {
  date: string;
  reservations: {
    checkIns: number;
    checkOuts: number;
    newBookings: number;
    cancellations: number;
  };
  revenue: {
    roomRevenue: number;
    totalRevenue: number;
    outstanding: number;
  };
  occupancy: {
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
  };
  alerts: {
    pending: number;
    maintenance: number;
    housekeeping: number;
  };
  topIssues: string[];
}

export function ManagerDailySummary() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    generateDailySummary();
  }, [selectedDate]);

  const generateDailySummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const startOfDay = new Date(selectedDate + 'T00:00:00Z');
      const endOfDay = new Date(selectedDate + 'T23:59:59Z');

      // Get reservation stats
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      const { data: checkIns } = await supabase
        .from('reservations')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('check_in_date', selectedDate);

      const { data: checkOuts } = await supabase
        .from('reservations')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('check_out_date', selectedDate);

      // Get room stats
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      // Get alerts
      const { data: alerts } = await supabase
        .from('staff_alerts')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Calculate revenue (placeholder - would integrate with actual revenue data)
      const roomRevenue = (reservations?.length || 0) * 150; // Average room rate
      
      const newBookings = reservations?.filter(r => r.status === 'confirmed').length || 0;
      const cancellations = reservations?.filter(r => r.status === 'cancelled').length || 0;
      
      const pendingAlerts = alerts?.filter(a => a.status === 'pending').length || 0;
      const maintenanceAlerts = alerts?.filter(a => a.alert_type === 'maintenance').length || 0;
      const housekeepingAlerts = alerts?.filter(a => a.alert_type === 'housekeeping').length || 0;

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = checkIns?.length || 0;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      setSummary({
        date: selectedDate,
        reservations: {
          checkIns: checkIns?.length || 0,
          checkOuts: checkOuts?.length || 0,
          newBookings,
          cancellations
        },
        revenue: {
          roomRevenue,
          totalRevenue: roomRevenue,
          outstanding: 0 // Would calculate from actual payment data
        },
        occupancy: {
          totalRooms,
          occupiedRooms,
          occupancyRate
        },
        alerts: {
          pending: pendingAlerts,
          maintenance: maintenanceAlerts,
          housekeeping: housekeepingAlerts
        },
        topIssues: alerts?.slice(0, 3).map(a => a.title || 'Issue') || []
      });

    } catch (error) {
      console.error('Error generating daily summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate daily summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const emailSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, email')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Create notification event for manager summary
      const { error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: userData.tenant_id,
          event_type: 'manager_daily_summary',
          event_source: 'system',
          source_id: 'daily-summary',
          template_data: {
            summary_date: selectedDate,
            manager_email: userData.email,
            ...summary
          },
          recipients: [{
            type: 'manager',
            email: userData.email,
            role: 'MANAGER'
          }],
          channels: ['email'],
          priority: 'medium',
          scheduled_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily summary email has been sent",
      });
    } catch (error) {
      console.error('Error sending summary email:', error);
      toast({
        title: "Error",
        description: "Failed to send summary email",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading daily summary...</div>;
  }

  if (!summary) {
    return <div className="text-center">No data available for selected date</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manager Daily Summary</h2>
          <p className="text-muted-foreground">
            Daily operations overview for {new Date(selectedDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button onClick={emailSummary}>
            <Mail className="mr-2 h-4 w-4" />
            Email Summary
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.occupancy.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.occupancy.occupiedRooms} of {summary.occupancy.totalRooms} rooms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary.revenue.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Room revenue today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.reservations.newBookings}
            </div>
            <p className="text-xs text-muted-foreground">Confirmed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.alerts.pending}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reservations Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reservations Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Check-ins</span>
                <Badge variant="default">{summary.reservations.checkIns}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Check-outs</span>
                <Badge variant="secondary">{summary.reservations.checkOuts}</Badge>
              </div>
              <div className="flex justify-between">
                <span>New Bookings</span>
                <Badge variant="default" className="bg-green-600">{summary.reservations.newBookings}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cancellations</span>
                <Badge variant="destructive">{summary.reservations.cancellations}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Staff Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Pending Alerts</span>
                <Badge variant="destructive">{summary.alerts.pending}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Maintenance Issues</span>
                <Badge variant="default">{summary.alerts.maintenance}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Housekeeping Tasks</span>
                <Badge variant="secondary">{summary.alerts.housekeeping}</Badge>
              </div>
              
              {summary.topIssues.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Top Issues</h4>
                  <div className="space-y-1">
                    {summary.topIssues.map((issue, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Room Revenue</div>
              <div className="text-2xl font-bold">₦{summary.revenue.roomRevenue.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Revenue</div>
              <div className="text-2xl font-bold">₦{summary.revenue.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Outstanding Payments</div>
              <div className="text-2xl font-bold text-orange-600">₦{summary.revenue.outstanding.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}