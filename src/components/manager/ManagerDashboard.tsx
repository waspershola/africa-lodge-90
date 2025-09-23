import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  UserCheck,
  FileText,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { SalaryApprovalWorkflow } from '@/components/owner/staff/SalaryApprovalWorkflow';

export function ManagerDashboard() {
  const { user, tenant } = useAuth();
  const { stats, loading } = useDashboardStats();
  const [activeTab, setActiveTab] = useState('overview');

  const managerKPIs = [
    {
      title: "Staff to Review",
      value: loading ? "..." : stats.pendingApprovals,
      description: "Pending salary approvals",
      icon: Users,
      color: "bg-amber-500/10 text-amber-600",
      action: () => setActiveTab('approvals')
    },
    {
      title: "Today's Bookings", 
      value: loading ? "..." : stats.totalBookings,
      description: "New reservations today",
      icon: Calendar,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Occupancy Rate",
      value: loading ? "..." : `${stats.occupancyRate}%`,
      description: "Current hotel occupancy", 
      icon: TrendingUp,
      color: stats.occupancyRate > 75 ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
    },
    {
      title: "Service Requests",
      value: loading ? "..." : stats.roomServiceOrders,
      description: "QR service orders today",
      icon: UserCheck,
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  const departmentMetrics = [
    {
      department: "Front Desk",
      activeStaff: 8,
      efficiency: 94,
      tasks: 12,
      status: "excellent"
    },
    {
      department: "Housekeeping", 
      activeStaff: 15,
      efficiency: 87,
      tasks: 28,
      status: "good"
    },
    {
      department: "Maintenance",
      activeStaff: 4,
      efficiency: 91,
      tasks: 6,
      status: "excellent"
    },
    {
      department: "Food & Beverage",
      activeStaff: 12,
      efficiency: 83,
      tasks: 18,
      status: "fair"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'good': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'fair': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Oversee daily operations at {tenant?.hotel_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Daily Report
          </Button>
          <Button className="bg-gradient-primary">
            <Settings className="h-4 w-4 mr-2" />
            Operations
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Staff Approvals</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managerKPIs.map((kpi, index) => (
              <Card 
                key={index} 
                className={`luxury-card ${kpi.action ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={kpi.action}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Manager Actions</CardTitle>
              <CardDescription>Common tasks for daily operations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Staff Schedule</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Approve Tasks</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Issues Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Budget Review</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <SalaryApprovalWorkflow />
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Monitor efficiency and workload across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentMetrics.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{dept.department}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{dept.activeStaff} active staff</span>
                        <span>{dept.tasks} pending tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{dept.efficiency}%</div>
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                      </div>
                      <Badge className={getStatusColor(dept.status)}>
                        {dept.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Manager Reports</h3>
              <p className="text-muted-foreground text-center mb-4">
                Daily operational reports and performance analytics
              </p>
              <Button className="bg-gradient-primary">
                Generate Daily Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}