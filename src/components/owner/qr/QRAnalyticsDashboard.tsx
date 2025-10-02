// Phase 4: QR Analytics Dashboard for Owners
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DateRangeFilter from '@/components/owner/reservations/DateRangeFilter';
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
} from 'recharts';
import { 
  QrCode, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Users,
  Download,
  Calendar
} from 'lucide-react';

interface QRAnalyticsData {
  totalScans: number;
  totalRequests: number;
  completionRate: number;
  avgResponseTime: number;
  topServices: Array<{ service: string; count: number; percentage: number }>;
  dailyStats: Array<{ date: string; scans: number; requests: number; completed: number }>;
  roomStats: Array<{ room: string; scans: number; requests: number }>;
  performanceMetrics: {
    pendingRequests: number;
    activeRequests: number;
    completedToday: number;
    overdueRequests: number;
  };
}

export const QRAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

  // Fetch QR analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['qr-analytics', user?.tenant_id, dateRange],
    queryFn: async (): Promise<QRAnalyticsData> => {
      if (!user?.tenant_id) throw new Error('No tenant ID');

      // Get basic analytics from qr_analytics table
      const { data: dailyAnalytics, error: analyticsError } = await supabase
        .from('qr_analytics')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .gte('period', dateRange.from.toISOString().split('T')[0])
        .lte('period', dateRange.to.toISOString().split('T')[0])
        .order('period');

      if (analyticsError) throw analyticsError;

      // Get requests data
      const { data: requests, error: requestsError } = await supabase
        .from('qr_orders')
        .select(`
          *,
          qr_code:qr_codes(
            room_id,
            rooms!qr_codes_room_id_fkey(room_number)
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (requestsError) throw requestsError;

      // Calculate metrics
      const totalRequests = requests?.length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

      // Calculate average response time (in minutes)
      const completedWithTimes = requests?.filter(r => 
        r.status === 'completed' && r.completed_at && r.created_at
      ) || [];
      
      const avgResponseTime = completedWithTimes.length > 0 
        ? completedWithTimes.reduce((acc, req) => {
            const created = new Date(req.created_at);
            const completed = new Date(req.completed_at);
            return acc + (completed.getTime() - created.getTime()) / (1000 * 60); // minutes
          }, 0) / completedWithTimes.length
        : 0;

      // Group by service type
      const serviceStats = requests?.reduce((acc, req) => {
        acc[req.service_type] = (acc[req.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topServices = Object.entries(serviceStats)
        .map(([service, count]) => ({
          service: service.replace('_', ' '),
          count,
          percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily stats
      const dailyStats = dailyAnalytics?.map(day => {
        const dayRequests = requests?.filter(r => 
          r.created_at.startsWith(day.period)
        ) || [];
        const dayCompleted = dayRequests.filter(r => r.status === 'completed').length;

        return {
          date: day.period,
          scans: day.request_count || 0,
          requests: dayRequests.length,
          completed: dayCompleted
        };
      }) || [];

      // Room stats
      const roomStats = requests?.reduce((acc, req) => {
        const roomNumber = req.qr_code?.rooms?.room_number || 'Unknown';
        if (!acc[roomNumber]) {
          acc[roomNumber] = { room: roomNumber, scans: 0, requests: 0 };
        }
        acc[roomNumber].requests += 1;
        return acc;
      }, {} as Record<string, { room: string; scans: number; requests: number }>) || {};

      // Performance metrics
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const performanceMetrics = {
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        activeRequests: requests?.filter(r => 
          ['assigned', 'accepted', 'preparing', 'on_route'].includes(r.status)
        ).length || 0,
        completedToday: requests?.filter(r => 
          r.status === 'completed' && 
          new Date(r.completed_at || '') >= todayStart
        ).length || 0,
        overdueRequests: requests?.filter(r => {
          if (r.status === 'completed') return false;
          const created = new Date(r.created_at);
          const hoursSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
          return hoursSinceCreated > 2; // Consider overdue after 2 hours
        }).length || 0
      };

      return {
        totalScans: dailyAnalytics?.reduce((sum, day) => sum + (day.request_count || 0), 0) || 0,
        totalRequests,
        completionRate,
        avgResponseTime,
        topServices,
        dailyStats,
        roomStats: Object.values(roomStats).sort((a, b) => b.requests - a.requests).slice(0, 10),
        performanceMetrics
      };
    },
    enabled: !!user?.tenant_id
  });

  const handleExportData = async () => {
    if (!analyticsData) return;

    const csvData = [
      ['Date', 'Scans', 'Requests', 'Completed'],
      ...analyticsData.dailyStats.map(day => [
        day.date,
        day.scans,
        day.requests,
        day.completed
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-analytics-${dateRange.from.toISOString().split('T')[0]}-${dateRange.to.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <QrCode className="h-8 w-8" />
            QR Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track QR code usage and guest service performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter
            dateRange={{
              from: dateRange.from,
              to: dateRange.to
            }}
            onDateRangeChange={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              }
            }}
          />
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{analyticsData.totalScans.toLocaleString()}</p>
              </div>
              <QrCode className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{analyticsData.totalRequests.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analyticsData.completionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{Math.round(analyticsData.avgResponseTime)}m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pending</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {analyticsData.performanceMetrics.pendingRequests}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {analyticsData.performanceMetrics.activeRequests}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completed Today</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {analyticsData.performanceMetrics.completedToday}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overdue</span>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {analyticsData.performanceMetrics.overdueRequests}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Requests"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.topServices}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ service, percentage }) => `${service} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.topServices.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topServices.map((service, index) => (
                    <div key={service.service} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium capitalize">{service.service}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {service.percentage.toFixed(1)}%
                        </span>
                        <Badge variant="outline">{service.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requests by Room</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.roomStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="room" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};