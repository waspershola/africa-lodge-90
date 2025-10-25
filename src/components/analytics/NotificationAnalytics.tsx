import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Users,
  Mail,
  Smartphone
} from "lucide-react";

interface NotificationStats {
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  costPerMessage: number;
  totalCost: number;
}

interface ChannelStats {
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
  cost: number;
  deliveryRate: number;
}

interface TimeSeriesData {
  date: string;
  sms: number;
  email: number;
  delivered: number;
  failed: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function NotificationAnalytics() {
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    deliveryRate: 0,
    averageDeliveryTime: 0,
    costPerMessage: 0,
    totalCost: 0
  });
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id' as any, user.id)
        .single();

      if (!userData?.tenant_id) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Get notification events
      const { data: events } = await supabase
        .from('notification_events')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', startDate.toISOString());

      // Get SMS logs
      const { data: smsLogs } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', startDate.toISOString());

      // Calculate overall stats
      const totalEvents = events?.length || 0;
      const completedEvents = events?.filter((e: any) => e.status === 'completed').length || 0;
      const failedEvents = events?.filter((e: any) => e.status === 'failed').length || 0;
      const pendingEvents = events?.filter((e: any) => e.status === 'pending').length || 0;

      const totalSMSCost = smsLogs?.reduce((acc: number, log: any) => acc + (log.credits_used || 0) * 5, 0) || 0; // ₦5 per SMS
      const deliveryRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

      setStats({
        totalSent: totalEvents,
        delivered: completedEvents,
        failed: failedEvents,
        pending: pendingEvents,
        deliveryRate,
        averageDeliveryTime: 2.5, // Minutes - would calculate from actual data
        costPerMessage: totalEvents > 0 ? totalSMSCost / totalEvents : 0,
        totalCost: totalSMSCost
      });

      // Calculate channel stats
      const channels = ['sms', 'email', 'in_app'];
      const channelData: ChannelStats[] = channels.map(channel => {
        const channelEvents = events?.filter((e: any) => e.channels?.includes(channel)) || [];
        const sent = channelEvents.length;
        const delivered = channelEvents.filter((e: any) => e.status === 'completed').length;
        const failed = channelEvents.filter((e: any) => e.status === 'failed').length;
        const cost = channel === 'sms' ? sent * 5 : 0; // SMS costs ₦5 each
        
        return {
          channel,
          sent,
          delivered,
          failed,
          cost,
          deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0
        };
      });

      setChannelStats(channelData);

      // Generate time series data for the last 7 days
      const timeData: TimeSeriesData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEvents = events?.filter((e: any) => 
          e.created_at?.split('T')[0] === dateStr
        ) || [];
        
        timeData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sms: dayEvents.filter((e: any) => e.channels?.includes('sms')).length,
          email: dayEvents.filter((e: any) => e.channels?.includes('email')).length,
          delivered: dayEvents.filter((e: any) => e.status === 'completed').length,
          failed: dayEvents.filter((e: any) => e.status === 'failed').length
        });
      }

      setTimeSeriesData(timeData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load notification analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading notification analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Notification Analytics</h2>
          <p className="text-muted-foreground">
            Monitor delivery rates, costs, and performance across all channels
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.deliveryRate.toFixed(1)}%
            </div>
            <Progress value={stats.deliveryRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDeliveryTime}min</div>
            <p className="text-xs text-muted-foreground">Average time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₦{stats.costPerMessage.toFixed(2)} per message
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Delivery Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Trends</CardTitle>
            <CardDescription>Daily notification volume and success rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="delivered" stroke="#0088FE" name="Delivered" />
                <Line type="monotone" dataKey="failed" stroke="#FF8042" name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Success rates by notification channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="delivered" fill="#0088FE" name="Delivered" />
                <Bar dataKey="failed" fill="#FF8042" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Channel Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Breakdown</CardTitle>
          <CardDescription>Detailed performance metrics by channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelStats.map((channel, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {channel.channel === 'sms' && <Smartphone className="h-5 w-5 text-blue-500" />}
                    {channel.channel === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                    {channel.channel === 'in_app' && <MessageSquare className="h-5 w-5 text-purple-500" />}
                    <h3 className="font-medium capitalize">{channel.channel}</h3>
                  </div>
                  <Badge 
                    variant={channel.deliveryRate > 90 ? 'default' : channel.deliveryRate > 70 ? 'secondary' : 'destructive'}
                  >
                    {channel.deliveryRate.toFixed(1)}% Success Rate
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Sent</div>
                    <div className="text-lg font-semibold">{channel.sent}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Delivered</div>
                    <div className="text-lg font-semibold text-green-600">{channel.delivered}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                    <div className="text-lg font-semibold text-red-600">{channel.failed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cost</div>
                    <div className="text-lg font-semibold">₦{channel.cost.toLocaleString()}</div>
                  </div>
                </div>

                <Progress value={channel.deliveryRate} className="mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROI & Optimization Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cost Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>SMS Cost per Success</span>
                <span className="font-medium">₦{stats.delivered > 0 ? (channelStats.find(c => c.channel === 'sms')?.cost || 0) / stats.delivered : 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Email Cost per Success</span>
                <span className="font-medium">₦0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Most Cost-Effective</span>
                <Badge variant="default">Email</Badge>
              </div>
              <div className="flex justify-between">
                <span>Fastest Delivery</span>
                <Badge variant="secondary">SMS</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="font-medium">Use Email for Non-Urgent Messages</div>
                <div className="text-sm text-muted-foreground">
                  Save ₦{(stats.totalSent * 5 * 0.3).toFixed(0)} monthly by using email for confirmations
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <div className="font-medium">Improve SMS Templates</div>
                <div className="text-sm text-muted-foreground">
                  {stats.failed} failed deliveries detected. Review templates for special characters.
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="font-medium">Peak Performance Time</div>
                <div className="text-sm text-muted-foreground">
                  Best delivery rates between 9 AM - 6 PM weekdays
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}