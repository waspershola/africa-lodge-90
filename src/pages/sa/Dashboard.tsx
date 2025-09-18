import { motion } from 'framer-motion';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Crown,
  Globe,
  Activity,
  CreditCard,
  Calendar,
  MapPin,
  Star,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useDashboardData, useMetrics } from '@/hooks/useApi';
import GlobalKPICards from '@/components/sa/GlobalKPICards';
import LiveEventStream from '@/components/sa/LiveEventStream';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const COLORS = ['#D32F2F', '#FFD700', '#FF7043', '#66BB6A', '#42A5F5'];

export default function Dashboard() {
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardData();
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useMetrics();

  if (dashboardLoading || metricsLoading) return <LoadingState message="Loading dashboard..." />;
  if (dashboardError || metricsError) return <ErrorState message="Failed to load dashboard" onRetry={() => { refetchDashboard(); refetchMetrics(); }} />;

  const dashboard = dashboardData?.data;
  const metrics = metricsData?.data;

  if (!dashboard || !metrics) return <ErrorState message="No dashboard data available" />;

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-danger';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success/10 text-success border-success/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'error': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="text-3xl font-bold display-heading text-gradient mb-2">Command Center</h1>
        <p className="text-muted-foreground">Comprehensive platform oversight and business intelligence</p>
      </motion.div>

      {/* Executive KPIs */}
      <GlobalKPICards 
        metrics={metrics} 
        onDrillDown={(metric) => console.log('Drill down to:', metric)} 
      />

      {/* Top Performers & Live Events */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Top Performing Hotels */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Top Performing Hotels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.topPerformers.map((hotel, index) => (
                <div key={hotel.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{hotel.name}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hotel.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {hotel.satisfaction}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">₦{(hotel.revenue / 1000000).toFixed(1)}M</div>
                    <div className="text-xs text-muted-foreground">{hotel.occupancy}% occupied</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Event Stream */}
        <LiveEventStream />
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trends */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trends.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => [`₦${(value / 1000000).toFixed(1)}M`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Distribution */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.regions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'count' ? `${value} hotels` : `₦${(value / 1000000).toFixed(1)}M`,
                    name === 'count' ? 'Hotels' : 'Revenue'
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Financial Overview & Resource Usage */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Billing Overview */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Billing Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Invoices</span>
              <span className="font-semibold">{dashboard.billingOverview.totalInvoices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="font-semibold text-success">{dashboard.billingOverview.paidInvoices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Failed Payments</span>
              <span className="font-semibold text-danger">{dashboard.billingOverview.failedPayments}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending Amount</span>
                <span className="font-bold text-warning">₦{(dashboard.billingOverview.pendingAmount / 1000).toFixed(0)}K</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Next cycle: {new Date(dashboard.billingOverview.nextBillingCycle).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage Summary */}
        <Card className="modern-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Resource Usage Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.resourceUsage.slice(0, 3).map((resource) => (
                <div key={resource.tenantId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{resource.name}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>DB: {resource.dbSize}GB</span>
                      <span>API: {resource.apiCalls.toLocaleString()}</span>
                      <span>Storage: {resource.storage}GB</span>
                    </div>
                  </div>
                  <Badge variant={resource.plan === 'Pro' ? 'default' : 'secondary'}>
                    {resource.plan}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}