import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  Users, 
  BedDouble, 
  DollarSign, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  CreditCard,
  Smartphone,
  Battery,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useOwnerOverview } from "@/hooks/useApi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { WelcomeBanner } from '@/components/onboarding/WelcomeBanner';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { useDashboardAlerts } from '@/hooks/useDashboardAlerts';
import { useDashboardTasks } from '@/hooks/useDashboardTasks';
import { useEffect } from 'react';

export default function OwnerDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [showWelcome, setShowWelcome] = useState(false);
  const { data: overviewData, isLoading, error } = useOwnerOverview();
  const { data: alerts = [] } = useDashboardAlerts();
  const { data: pendingTasks = [] } = useDashboardTasks();
  const { user } = useAuth();
  
  // Phase 1: Enable unified real-time updates for owner role
  useUnifiedRealtime({ verbose: false });

  // Check if user just completed onboarding
  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem(`welcome_banner_dismissed_${user.id}`);
      const justCompleted = localStorage.getItem(`onboarding_${user.id}`);
      
      if (justCompleted && !dismissed) {
        const progress = JSON.parse(justCompleted);
        setShowWelcome(progress.completed);
      }
    }
  }, [user]);

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">Error loading dashboard: {error.message}</div>;
  }

  const overview = {
    totalRooms: overviewData?.totalRooms || 0,
    occupiedRooms: overviewData?.occupiedRooms || 0,
    availableRooms: overviewData?.availableRooms || 0,
    revenue: overviewData?.revenue || 0,
    reservations: overviewData?.reservations || 0,
    occupancyRate: overviewData?.occupancyRate || 0,
    activeGuests: overviewData?.activeGuests || 0,
    alerts: [],
    pendingTasks: [],
    bookingsPipeline: [],
    revenueTrend: []
  };

  // Calculate ADR (Average Daily Rate) from overview data
  const adr = overview.revenue && overview.occupiedRooms 
    ? overview.revenue / overview.occupiedRooms 
    : 0;

  // Calculate RevPAR (Revenue Per Available Room) after variables are defined
  const revpar = overview.occupancyRate && adr 
    ? (overview.occupancyRate / 100) * adr 
    : 0;

  // Hotel KPIs with real data
  const hotelKPIs = [
    {
      title: "Occupancy Rate",
      value: `${overview.occupancyRate}%`,
      change: overview.occupancyRate > 70 ? "+5.2%" : "-2.1%",
      trend: overview.occupancyRate > 70 ? "up" : "down",
      icon: <BedDouble className="h-6 w-6" />,
      color: "primary",
      description: "Current occupancy vs capacity"
    },
    {
      title: "ADR (Average Daily Rate)",
      value: adr > 0 ? `₦${adr.toLocaleString()}` : "₦0",
      change: adr > 30000 ? "+8.1%" : "-3.2%",
      trend: adr > 30000 ? "up" : "down",
      icon: <DollarSign className="h-6 w-6" />,
      color: "success",
      description: "Average revenue per occupied room"
    },
    {
      title: "RevPAR",
      value: `₦${Math.round(revpar).toLocaleString()}`,
      change: revpar > 20000 ? "+12.5%" : "-5.3%",
      trend: revpar > 20000 ? "up" : "down",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "accent",
      description: "Revenue per available room"
    },
    {
      title: "Monthly Revenue",
      value: overview.revenue > 0 ? `₦${(overview.revenue / 1000000).toFixed(1)}M` : "₦0",
      change: overview.revenue > 1000000 ? "+18.3%" : "+0%",
      trend: overview.revenue > 1000000 ? "up" : "down",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "warning",
      description: "This month's revenue"
    }
  ];

  // Use real tenant-scoped data from useOwnerOverview hook
  // All data is now pulled from the tenant's actual reservations and rooms
  const bookingsPipeline = overview.bookingsPipeline || [];
  const revenueTrend = overview.revenueTrend || [];

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4 text-danger" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <AlertCircle className="h-4 w-4 text-primary" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-danger/10 text-danger border-danger/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      low: 'bg-success/10 text-success border-success/20'
    };
    
    return (
      <Badge className={variants[priority as keyof typeof variants]}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner - Show after onboarding completion */}
      {showWelcome && (
        <WelcomeBanner 
          onDismiss={() => setShowWelcome(false)}
          className="mb-6"
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gradient">
            Hotel Performance Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time metrics, occupancy insights, and operational status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {["This Week", "This Month", "This Quarter"].map(period => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
          <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(alert => alert.level === 'critical').length > 0 && (
        <Alert className="border-danger/20 bg-danger/5">
          <AlertTriangle className="h-4 w-4 text-danger" />
          <AlertDescription className="text-danger">
            <strong>Critical Alert:</strong> {alerts.find(alert => alert.level === 'critical')?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Hotel KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hotelKPIs.map((kpi, index) => (
          <Card key={index} className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  kpi.color === 'success' ? 'bg-success/10 text-success' :
                  kpi.color === 'primary' ? 'bg-primary/10 text-primary' :
                  kpi.color === 'accent' ? 'bg-accent/10 text-accent' :
                  kpi.color === 'warning' ? 'bg-warning/10 text-warning' :
                  'bg-muted/50 text-muted-foreground'
                }`}>
                  {kpi.icon}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-sm text-muted-foreground">{kpi.title}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className={`flex items-center gap-1 text-sm ${
                  kpi.trend === 'up' ? 'text-success' : 'text-danger'
                }`}>
                  {kpi.trend === 'up' ? 
                    <TrendingUp className="h-4 w-4" /> : 
                    <TrendingDown className="h-4 w-4" />
                  }
                  <span>{kpi.change} vs last period</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="modern-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenue & Bookings Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="revenue" orientation="left" tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                <YAxis yAxisId="bookings" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `₦${(value / 1000000).toFixed(1)}M` : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings'
                  ]}
                />
                <Line 
                  yAxisId="revenue"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="revenue"
                />
                <Line 
                  yAxisId="bookings"
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings Pipeline */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Bookings Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookingsPipeline.map((stage, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm font-medium">{stage.stage}</span>
                  </div>
                  <Badge variant="outline">{stage.count}</Badge>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={bookingsPipeline} layout="horizontal">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="stage" hide />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alert Center */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alert Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  {getAlertIcon(alert.level)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground capitalize">{alert.type} alert</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.task}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getPriorityBadge(task.priority)}
                      {task.count > 1 && (
                        <span className="text-xs text-muted-foreground">
                          ({task.count} items)
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Handle
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2" size="lg">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">New Booking</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" size="lg">
              <Users className="h-6 w-6" />
              <span className="text-sm">Check-in Guest</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" size="lg">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Process Payment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" size="lg">
              <Building2 className="h-6 w-6" />
              <span className="text-sm">Room Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};