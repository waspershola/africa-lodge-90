import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard,
  Receipt,
  Coffee,
  Bed,
  Car,
  Utensils,
  Wine
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DepartmentFinance = () => {
  const departments = [
    {
      name: 'Rooms',
      icon: Bed,
      revenue: 245000,
      target: 300000,
      growth: 12.5,
      transactions: 45,
      avgValue: 5444,
      color: 'text-blue-600'
    },
    {
      name: 'Restaurant',
      icon: Utensils,
      revenue: 89000,
      target: 100000,
      growth: -3.2,
      transactions: 156,
      avgValue: 570,
      color: 'text-green-600'
    },
    {
      name: 'Bar',
      icon: Wine,
      revenue: 34000,
      target: 45000,
      growth: 8.7,
      transactions: 89,
      avgValue: 382,
      color: 'text-purple-600'
    },
    {
      name: 'Events',
      icon: Calendar,
      revenue: 125000,
      target: 150000,
      growth: 25.3,
      transactions: 8,
      avgValue: 15625,
      color: 'text-orange-600'
    },
    {
      name: 'Spa & Wellness',
      icon: Coffee,
      revenue: 28000,
      target: 35000,
      growth: 15.1,
      transactions: 23,
      avgValue: 1217,
      color: 'text-pink-600'
    },
    {
      name: 'Transport',
      icon: Car,
      revenue: 15000,
      target: 20000,
      growth: -5.4,
      transactions: 34,
      avgValue: 441,
      color: 'text-gray-600'
    }
  ];

  const dailyCashSummary = {
    totalCash: 89500,
    cardPayments: 345000,
    digitalPayments: 101500,
    totalExpected: 536000,
    variance: 0,
    lastUpdated: '2 minutes ago'
  };

  const discountsAndComplaints = [
    { type: 'Room Discount', amount: 5000, reason: 'AC Issue Room 203', time: '1 hour ago' },
    { type: 'Meal Comp', amount: 2500, reason: 'Wrong Order', time: '2 hours ago' },
    { type: 'Late Checkout', amount: -1000, reason: 'Fee Waived', time: '3 hours ago' },
    { type: 'Event Discount', amount: 15000, reason: 'Corporate Rate', time: '4 hours ago' }
  ];

  const todayMetrics = {
    totalRevenue: 536000,
    projectedDaily: 580000,
    performance: 92.4,
    yesterdayComparison: 8.5
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Department Finance Control</h1>
          <p className="text-muted-foreground">Real-time revenue tracking and financial oversight</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Receipt className="h-4 w-4 mr-2" />
            Daily Report
          </Button>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Cash Reconciliation
          </Button>
        </div>
      </motion.div>

      {/* Today's Financial Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Today's Financial Summary
            </CardTitle>
            <CardDescription>Real-time revenue performance vs targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-3xl font-bold text-green-600">
                  ₦{todayMetrics.totalRevenue.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Daily Target</div>
                <div className="text-3xl font-bold text-blue-600">
                  ₦{todayMetrics.projectedDaily.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Performance</div>
                <div className="text-3xl font-bold text-purple-600">
                  {todayMetrics.performance}%
                </div>
                <Progress value={todayMetrics.performance} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">vs Yesterday</div>
                <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <TrendingUp className="h-6 w-6" />
                  +{todayMetrics.yesterdayComparison}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="departments">Department Revenue</TabsTrigger>
          <TabsTrigger value="cash">Cash & POS</TabsTrigger>
          <TabsTrigger value="adjustments">Discounts & Comps</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-6">
          {/* Department Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <dept.icon className={`h-5 w-5 ${dept.color}`} />
                        <h3 className="font-medium">{dept.name}</h3>
                      </div>
                      {dept.growth > 0 ? (
                        <Badge variant="default" className="text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{dept.growth}%
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {dept.growth}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Revenue Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Revenue vs Target</span>
                          <span>₦{dept.revenue.toLocaleString()} / ₦{dept.target.toLocaleString()}</span>
                        </div>
                        <Progress value={(dept.revenue / dept.target) * 100} className="h-2" />
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Transactions</div>
                          <div className="font-medium">{dept.transactions}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Value</div>
                          <div className="font-medium">₦{dept.avgValue.toLocaleString()}</div>
                        </div>
                      </div>

                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cash" className="space-y-6">
          {/* Cash & POS Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Daily Cash & POS Reconciliation
                </CardTitle>
                <CardDescription>
                  Compare deposits vs system records (Last updated: {dailyCashSummary.lastUpdated})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Cash Payments</div>
                    <div className="text-2xl font-bold">₦{dailyCashSummary.totalCash.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Card Payments</div>
                    <div className="text-2xl font-bold">₦{dailyCashSummary.cardPayments.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Digital Payments</div>
                    <div className="text-2xl font-bold">₦{dailyCashSummary.digitalPayments.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Collected</div>
                    <div className="text-2xl font-bold text-green-600">
                      ₦{(dailyCashSummary.totalCash + dailyCashSummary.cardPayments + dailyCashSummary.digitalPayments).toLocaleString()}
                    </div>
                  </div>
                </div>

                {dailyCashSummary.variance === 0 ? (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="text-green-700 font-medium">✓ Perfect Match - No Variance</div>
                    <div className="text-sm text-green-600">All payments reconciled successfully</div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="text-red-700 font-medium">⚠ Variance Detected</div>
                    <div className="text-sm text-red-600">₦{Math.abs(dailyCashSummary.variance).toLocaleString()} difference found</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-6">
          {/* Discounts & Complaints Impact */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Adjustments</CardTitle>
                <CardDescription>Track discounts, comps, and complaint-related revenue impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {discountsAndComplaints.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.type}</div>
                        <div className="text-sm text-muted-foreground">{item.reason}</div>
                        <div className="text-xs text-muted-foreground">{item.time}</div>
                      </div>
                      <div className={`text-lg font-bold ${item.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.amount > 0 ? '-' : '+'}₦{Math.abs(item.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Discounts Today</div>
                    <div className="text-2xl font-bold text-red-600">₦21,500</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm text-muted-foreground">Complaint Comps</div>
                    <div className="text-2xl font-bold text-orange-600">₦2,500</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-muted-foreground">Revenue Impact</div>
                    <div className="text-2xl font-bold text-blue-600">-4.2%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Financial Analytics Dashboard</CardTitle>
                <CardDescription>Advanced financial insights and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Detailed financial trends, forecasting, and performance analytics will be available here.
                  </p>
                  <Button>
                    View Revenue Trends
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DepartmentFinance;