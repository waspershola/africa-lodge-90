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
  Zap,
  UserCheck,
  TrendingDown,
  Target,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useDashboardData, useMetrics } from '@/hooks/useApi';
import BroadcastPanel from '@/components/sa/BroadcastPanel';
import SupportConsole from '@/components/sa/SupportConsole';
import EmergencyModeToggle from '@/components/sa/EmergencyModeToggle';
import TemplateLibrary from '@/components/sa/TemplateLibrary';
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
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="modern-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{(metrics.overview.totalRevenue / 1000000).toFixed(1)}M</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-success/10 text-success border-success/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{metrics.overview.growthRate}%
              </Badge>
              <span className="text-xs text-muted-foreground">MoM Growth</span>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent" />
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">₦{(metrics.overview.mrr / 1000000).toFixed(1)}M</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={85} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">85% ARR</span>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-success" />
              Active Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metrics.overview.activeTenants}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">of {metrics.overview.totalTenants} total</span>
              <Badge variant="outline" className="border-success/30">
                {((metrics.overview.activeTenants / metrics.overview.totalTenants) * 100).toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-gradient-to-br from-danger/5 to-danger/10 border-danger/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-danger" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{metrics.overview.avgOccupancy}%</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Avg Occupancy</span>
              <Badge className="bg-success/10 text-success border-success/20">
                Optimal
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Performers & Health Status */}
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

        {/* System Health Monitor */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              System Health Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.healthStatus.map((tenant) => (
                <div key={tenant.tenantId} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                  <Badge className={getHealthBadge(tenant.status)}>
                    {tenant.status}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{tenant.name}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Uptime: {tenant.uptime}%</span>
                      <span>Latency: {tenant.latency}ms</span>
                      <span>Errors: {tenant.errors}</span>
                    </div>
                  </div>
                  <div className="w-20">
                    <Progress value={tenant.uptime} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Analytics Row */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Churn & Retention */}
        <Card className="modern-card bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-warning" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{dashboard.churnMetrics.churnRate}%</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">{dashboard.churnMetrics.cancelledThisMonth} this month</span>
              <Badge className="bg-danger/10 text-danger border-danger/20">
                {dashboard.churnMetrics.atRiskHotels} at risk
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Analytics */}
        <Card className="modern-card bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-success" />
              Active Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{dashboard.userAnalytics.totalActiveUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                Front Desk: {dashboard.userAnalytics.byRole.frontDesk}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Forecasting */}
        <Card className="modern-card bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              MRR Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ₦{(dashboard.revenueForecasting.projectedMRR / 1000000).toFixed(1)}M
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={dashboard.revenueForecasting.forecastAccuracy} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">{dashboard.revenueForecasting.forecastAccuracy}% accuracy</span>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Status */}
        <Card className="modern-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">99.8%</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Platform Uptime</span>
              <Badge className="bg-success/10 text-success border-success/20">
                Healthy
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Management & Control Panels */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          <BroadcastPanel />
          <TemplateLibrary />
        </div>
        <div className="space-y-8">
          <SupportConsole />
          <EmergencyModeToggle />
        </div>
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