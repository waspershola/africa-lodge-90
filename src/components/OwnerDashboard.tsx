import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Users, 
  BedDouble, 
  DollarSign, 
  Calendar,
  Settings,
  FileText,
  Smartphone,
  Battery,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Hotel,
  UserCircle,
  Building2,
  QrCode,
  Wallet
} from "lucide-react";


const mockRevenueData = [
  { month: 'Jan', amount: 3200000 },
  { month: 'Feb', amount: 3800000 },
  { month: 'Mar', amount: 4100000 },
  { month: 'Apr', amount: 4250000 }
];

const sidebarItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    href: "/owner-dashboard",
    active: true
  },
  {
    title: "Hotel Configuration", 
    icon: Settings,
    href: "/owner-dashboard/configuration"
  },
  {
    title: "Reservations",
    icon: Calendar,
    href: "/owner-dashboard/reservations"
  },
  {
    title: "Rooms & Rates",
    icon: BedDouble,
    href: "/owner-dashboard/rooms"
  },
  {
    title: "Guests",
    icon: Users,
    href: "/owner-dashboard/guests"
  },
  {
    title: "QR Manager",
    icon: QrCode,
    href: "/owner-dashboard/qr-manager"
  },
  {
    title: "Billing & Payments",
    icon: CreditCard,
    href: "/owner-dashboard/billing"
  },
  {
    title: "Wallet Management",
    icon: Wallet,
    href: "/owner-dashboard/wallet-management"
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/owner-dashboard/reports"
  },
  {
    title: "Staff & Roles",
    icon: UserCircle,
    href: "/owner-dashboard/staff"
  },
  {
    title: "Power & Fuel",
    icon: Battery,
    href: "/owner-dashboard/utilities"
  }
];

const AppSidebar = () => {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { tenant } = useAuth();

  return (
    <Sidebar className={!open ? "w-16" : "w-64"}>
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <Hotel className="h-6 w-6 text-sidebar-accent-foreground" />
            </div>
            {open && (
              <div>
                <div className="font-playfair font-bold text-sidebar-primary">
                  {tenant?.hotel_name || 'Hotel'}
                </div>
                <div className="text-sm text-sidebar-foreground/70">Owner Dashboard</div>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`${item.active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}
                  >
                    <button 
                      className="flex items-center gap-3 w-full p-3"
                      onClick={() => navigate(item.href)}
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export const OwnerDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const { user, tenant } = useAuth();
  const { stats, loading } = useDashboardStats();
  const navigate = useNavigate();

  const kpiCards = [
    {
      title: "Total Revenue",
      value: loading ? "Loading..." : `₦${(stats.totalRevenue / 1000000).toFixed(1)}M`,
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-6 w-6" />,
      color: "success"
    },
    {
      title: "Occupancy Rate", 
      value: loading ? "Loading..." : `${stats.occupancyRate}%`,
      change: "+5.2%", 
      trend: "up",
      icon: <BedDouble className="h-6 w-6" />,
      color: "primary"
    },
    {
      title: "Average Daily Rate",
      value: loading ? "Loading..." : `₦${(stats.avgDailyRate / 1000).toFixed(0)}k`,
      change: "+8.1%",
      trend: "up", 
      icon: <TrendingUp className="h-6 w-6" />,
      color: "accent"
    },
    {
      title: "Total Bookings",
      value: loading ? "Loading..." : stats.totalBookings,
      change: "-2.3%",
      trend: "down",
      icon: <Calendar className="h-6 w-6" />,
      color: "warning"
    }
  ];

  const operationalCards = [
    {
      title: "Power Costs",
      value: loading ? "Loading..." : `₦${(stats.powerCost / 1000).toFixed(0)}k`,
      subtitle: "NEPA vs Gen tracking",
      icon: <Battery className="h-6 w-6" />,
      color: "warning",
      onClick: () => navigate('/owner-dashboard/utilities')
    },
    {
      title: "Fuel Savings", 
      value: loading ? "Loading..." : `₦${(stats.fuelSavings / 1000).toFixed(0)}k`,
      subtitle: "Efficiency improvements",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "success",
      onClick: () => navigate('/owner-dashboard/utilities')
    },
    {
      title: "QR Service Orders",
      value: loading ? "Loading..." : stats.roomServiceOrders,
      subtitle: "QR-based requests",
      icon: <Smartphone className="h-6 w-6" />,
      color: "primary",
      onClick: () => navigate('/owner-dashboard/qr-manager')
    },
    {
      title: "Active Staff",
      value: loading ? "Loading..." : stats.staffCount,
      subtitle: "All departments", 
      icon: <Users className="h-6 w-6" />,
      color: "muted",
      onClick: () => navigate('/owner-dashboard/staff')
    }
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <main className="flex-1 bg-background">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="font-playfair text-2xl font-bold text-gradient">
                  Owner Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  Export Report
                </Button>
                <Button className="bg-gradient-primary" size="sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="p-6 space-y-8">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Performance Overview</h2>
                <p className="text-muted-foreground mt-1">
                  Track your hotel's key metrics and operational efficiency
                </p>
              </div>
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
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiCards.map((card, index) => (
                <Card key={index} className="luxury-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        card.color === 'success' ? 'bg-success/10 text-success' :
                        card.color === 'primary' ? 'bg-primary/10 text-primary' :
                        card.color === 'accent' ? 'bg-accent/10 text-accent-foreground' :
                        card.color === 'warning' ? 'bg-warning/10 text-warning-foreground' :
                        'bg-muted/50 text-muted-foreground'
                      }`}>
                        {card.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{card.value}</div>
                        <div className="text-sm text-muted-foreground">{card.title}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className={`flex items-center gap-1 text-sm ${
                        card.trend === 'up' ? 'text-success' : 'text-danger'
                      }`}>
                        {card.trend === 'up' ? 
                          <TrendingUp className="h-4 w-4" /> : 
                          <TrendingDown className="h-4 w-4" />
                        }
                        <span>{card.change} from last period</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Chart & Operational Cards */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Revenue Trend */}
              <Card className="luxury-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-4 p-4">
                    {mockRevenueData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-primary rounded-t"
                          style={{ 
                            height: `${(data.amount / Math.max(...mockRevenueData.map(d => d.amount))) * 200}px`
                          }}
                        />
                        <div className="text-center mt-2">
                          <div className="font-medium">{data.month}</div>
                          <div className="text-sm text-muted-foreground">
                            ₦{(data.amount / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Operational Metrics */}
              <div className="space-y-4">
                {operationalCards.map((card, index) => (
                  <Card 
                    key={index} 
                    className="luxury-card cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={card.onClick}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          card.color === 'success' ? 'bg-success/10 text-success' :
                          card.color === 'primary' ? 'bg-primary/10 text-primary' :
                          card.color === 'warning' ? 'bg-warning/10 text-warning-foreground' :
                          'bg-muted/50 text-muted-foreground'
                        }`}>
                          {card.icon}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{card.value}</div>
                          <div className="text-xs text-muted-foreground">{card.subtitle}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium mt-2">{card.title}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/owner-dashboard/qr-manager')}
                  >
                    <QrCode className="h-6 w-6" />
                    <span className="text-sm">QR Manager</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/owner-dashboard/reports')}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">View Reports</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/owner-dashboard/staff')}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Manage Staff</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate('/owner-dashboard/configuration')}
                  >
                    <Settings className="h-6 w-6" />
                    <span className="text-sm">Hotel Settings</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 py-2 border-b">
                      <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Payment received</div>
                        <div className="text-sm text-muted-foreground">₦45,000 from Room 305</div>
                      </div>
                      <Badge variant="secondary">2m ago</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 py-2 border-b">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Room service order</div>
                        <div className="text-sm text-muted-foreground">QR order from Room 201</div>
                      </div>
                      <Badge variant="secondary">5m ago</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">New reservation</div>
                        <div className="text-sm text-muted-foreground">3-night stay booked</div>
                      </div>
                      <Badge variant="secondary">12m ago</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default OwnerDashboard;