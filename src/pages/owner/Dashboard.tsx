import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  BedDouble, 
  DollarSign, 
  Calendar,
  Smartphone,
  Battery,
  CreditCard,
  TrendingUp,
  TrendingDown,
  QrCode,
  FileText,
  Building2
} from "lucide-react";

// Mock data (same as before)
const mockStats = {
  totalRevenue: 4250000,
  occupancyRate: 78,
  totalBookings: 156,
  avgDailyRate: 25000,
  powerCost: 320000,
  fuelSavings: 180000,
  roomServiceOrders: 234,
  staffCount: 28
};

const mockRevenueData = [
  { month: 'Jan', amount: 3200000 },
  { month: 'Feb', amount: 3800000 },
  { month: 'Mar', amount: 4100000 },
  { month: 'Apr', amount: 4250000 }
];

const OwnerDashboardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `₦${(mockStats.totalRevenue / 1000000).toFixed(1)}M`,
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-6 w-6" />,
      color: "success"
    },
    {
      title: "Occupancy Rate",
      value: `${mockStats.occupancyRate}%`,
      change: "+5.2%", 
      trend: "up",
      icon: <BedDouble className="h-6 w-6" />,
      color: "primary"
    },
    {
      title: "Average Daily Rate",
      value: `₦${(mockStats.avgDailyRate / 1000).toFixed(0)}k`,
      change: "+8.1%",
      trend: "up", 
      icon: <TrendingUp className="h-6 w-6" />,
      color: "accent"
    },
    {
      title: "Total Bookings",
      value: mockStats.totalBookings,
      change: "-2.3%",
      trend: "down",
      icon: <Calendar className="h-6 w-6" />,
      color: "warning"
    }
  ];

  const operationalCards = [
    {
      title: "Power Costs",
      value: `₦${(mockStats.powerCost / 1000).toFixed(0)}k`,
      subtitle: "NEPA vs Gen tracking",
      icon: <Battery className="h-6 w-6" />,
      color: "warning"
    },
    {
      title: "Fuel Savings",
      value: `₦${(mockStats.fuelSavings / 1000).toFixed(0)}k`,
      subtitle: "Efficiency improvements",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "success"
    },
    {
      title: "Room Service Orders",
      value: mockStats.roomServiceOrders,
      subtitle: "QR-based orders",
      icon: <Smartphone className="h-6 w-6" />,
      color: "primary"
    },
    {
      title: "Active Staff",
      value: mockStats.staffCount,
      subtitle: "All departments",
      icon: <Users className="h-6 w-6" />,
      color: "muted"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gradient">
            Performance Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your hotel's key metrics and operational efficiency
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
          <Button className="bg-gradient-primary" size="sm">
            <Building2 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
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
            <Card key={index} className="luxury-card">
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
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <QrCode className="h-6 w-6" />
              <span className="text-sm">Generate QR Codes</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">View Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Manage Staff</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Building2 className="h-6 w-6" />
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
  );
};

export default OwnerDashboardPage;