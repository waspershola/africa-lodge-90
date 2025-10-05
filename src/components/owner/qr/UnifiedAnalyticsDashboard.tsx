import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Clock, TrendingUp, Activity, Smartphone, MapPin } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfWeek, format, subDays } from 'date-fns';

interface AnalyticsDashboardProps {
  tenantId: string;
}

export function UnifiedAnalyticsDashboard({ tenantId }: AnalyticsDashboardProps) {
  // Fetch scan logs
  const { data: scanLogs, isLoading: scansLoading } = useQuery({
    queryKey: ['qr-scan-analytics', tenantId],
    queryFn: async () => {
      const startDate = startOfWeek(new Date());
      const { data, error } = await supabase
        .from('qr_scan_logs')
        .select('*, qr_codes(label, qr_type)')
        .eq('tenant_id', tenantId)
        .gte('scanned_at', startDate.toISOString())
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch request analytics
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['qr-request-analytics', tenantId],
    queryFn: async () => {
      const startDate = subDays(new Date(), 7);
      const { data, error } = await supabase
        .from('qr_requests')
        .select('*, qr_codes(label, qr_type)')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;
      return data;
    },
  });

  if (scansLoading || requestsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate metrics
  const totalScans = scanLogs?.length || 0;
  const totalRequests = requests?.length || 0;
  const avgResponseTime = requests?.reduce((acc, req) => {
    if (req.completed_at && req.created_at) {
      const diff = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
      return acc + diff / 1000 / 60; // minutes
    }
    return acc;
  }, 0) / (requests?.filter(r => r.completed_at).length || 1);

  // Request status breakdown
  const statusData = [
    { name: 'Pending', value: requests?.filter(r => r.status === 'pending').length || 0, fill: 'hsl(var(--chart-1))' },
    { name: 'In Progress', value: requests?.filter(r => r.status === 'in_progress').length || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Completed', value: requests?.filter(r => r.status === 'completed').length || 0, fill: 'hsl(var(--chart-3))' },
    { name: 'Cancelled', value: requests?.filter(r => r.status === 'cancelled').length || 0, fill: 'hsl(var(--chart-4))' },
  ];

  // Daily scan trends
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const scansOnDay = scanLogs?.filter(log => 
      format(new Date(log.scanned_at), 'yyyy-MM-dd') === dateStr
    ).length || 0;
    
    return {
      date: format(date, 'EEE'),
      scans: scansOnDay,
    };
  });

  // Device breakdown
  const deviceData = [
    { 
      name: 'Mobile', 
      value: scanLogs?.filter(log => {
        const deviceInfo = log.device_info as Record<string, any> | null;
        return deviceInfo?.platform?.includes('Mobile');
      }).length || 0,
      fill: 'hsl(var(--chart-1))'
    },
    { 
      name: 'Desktop', 
      value: scanLogs?.filter(log => {
        const deviceInfo = log.device_info as Record<string, any> | null;
        return !deviceInfo?.platform?.includes('Mobile');
      }).length || 0,
      fill: 'hsl(var(--chart-2))'
    },
  ];

  // Popular services
  const serviceData = requests?.reduce((acc: Record<string, number>, req) => {
    const type = req.request_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const popularServices = Object.entries(serviceData || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(1)} min</div>
            <p className="text-xs text-muted-foreground">For completed requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scan Trends</CardTitle>
            <CardDescription>Daily QR code scans over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
            <CardDescription>Current status distribution of all requests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popular Services</CardTitle>
            <CardDescription>Most requested services</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularServices}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>Breakdown by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
