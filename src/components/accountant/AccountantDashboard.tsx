import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Users,
  FileText,
  Calculator,
  PieChart,
  Banknote,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { SalaryApprovalWorkflow } from '@/components/owner/staff/SalaryApprovalWorkflow';

export function AccountantDashboard() {
  const { user, tenant } = useAuth();
  const { stats, loading } = useDashboardStats();
  const [activeTab, setActiveTab] = useState('overview');

  const financialKPIs = [
    {
      title: "Salary Payments",
      value: loading ? "..." : stats.pendingApprovals,
      description: "Pending payments to process",
      icon: Users,
      color: "bg-green-500/10 text-green-600",
      action: () => setActiveTab('payments')
    },
    {
      title: "Monthly Revenue", 
      value: loading ? "..." : `₦${(stats.totalRevenue / 1000000).toFixed(1)}M`,
      description: "Total revenue this month",
      icon: TrendingUp,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Outstanding Bills",
      value: loading ? "..." : stats.outstandingPayments,
      description: "Unpaid invoices",
      icon: AlertTriangle,
      color: "bg-orange-500/10 text-orange-600"
    },
    {
      title: "Cash Flow",
      value: loading ? "..." : `₦${((stats.totalRevenue - stats.powerCost) / 1000).toFixed(0)}k`,
      description: "Net cash flow this month",
      icon: DollarSign,
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  const accountingTasks = [
    {
      task: "Process Payroll",
      count: 15,
      priority: "high",
      deadline: "Today",
      type: "salary"
    },
    {
      task: "Reconcile Bank Statements", 
      count: 3,
      priority: "medium",
      deadline: "Tomorrow",
      type: "reconciliation"
    },
    {
      task: "Generate Monthly Reports",
      count: 1,
      priority: "high", 
      deadline: "End of Month",
      type: "reporting"
    },
    {
      task: "Vendor Payments",
      count: 8,
      priority: "medium",
      deadline: "This Week",
      type: "payments"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accountant Dashboard</h1>
          <p className="text-muted-foreground">
            Financial management for {tenant?.hotel_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Receipt className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button className="bg-gradient-primary">
            <Calculator className="h-4 w-4 mr-2" />
            Process Payments
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Salary Payments</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {financialKPIs.map((kpi, index) => (
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

          {/* Accounting Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Accounting Tasks</CardTitle>
              <CardDescription>Tasks requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountingTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{task.task}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{task.count} items</span>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{task.deadline}</div>
                      <Button size="sm" variant="outline" className="mt-1">
                        Process
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Financial Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Operations</CardTitle>
              <CardDescription>Common accounting and finance tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Banknote className="h-6 w-6" />
                <span className="text-sm">Process Payroll</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Vendor Payments</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <PieChart className="h-6 w-6" />
                <span className="text-sm">Budget Analysis</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Receipt className="h-6 w-6" />
                <span className="text-sm">Tax Reports</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <SalaryApprovalWorkflow />
        </TabsContent>

        <TabsContent value="accounting">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Accounting Module</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comprehensive accounting features coming soon
              </p>
              <Button className="bg-gradient-primary">
                Access Accounting Tools
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate comprehensive financial reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Profit & Loss Statement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <PieChart className="h-4 w-4 mr-2" />
                  Balance Sheet
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Cash Flow Statement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Receipt className="h-4 w-4 mr-2" />
                  Tax Summary Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Reports</CardTitle>
                <CardDescription>Staff salary and payroll analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Monthly Payroll Summary
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Banknote className="h-4 w-4 mr-2" />
                  Salary Distribution Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calculator className="h-4 w-4 mr-2" />
                  Tax Deductions Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Overtime & Benefits Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}