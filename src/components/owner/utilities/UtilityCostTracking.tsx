import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Download } from "lucide-react";
import { useState } from "react";
import { useUtilitiesData } from "@/hooks/data/useUtilitiesData";
import { format, startOfMonth, subMonths } from "date-fns";

export default function UtilityCostTracking() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const { utilityCosts, isLoading } = useUtilitiesData();

  if (isLoading) {
    return <div>Loading utility cost data...</div>;
  }

  // Calculate cost statistics
  const currentMonth = utilityCosts.filter(cost => 
    new Date(cost.cost_month).getMonth() === new Date().getMonth()
  );
  const previousMonth = utilityCosts.filter(cost =>
    new Date(cost.cost_month).getMonth() === subMonths(new Date(), 1).getMonth()
  );

  const totalMonthly = currentMonth.reduce((sum, cost) => sum + Number(cost.total_cost), 0);
  const previousMonthTotal = previousMonth.reduce((sum, cost) => sum + Number(cost.total_cost), 0);
  const powerCost = currentMonth.reduce((sum, c) => sum + Number(c.electricity_cost), 0);
  const fuelCost = currentMonth.reduce((sum, c) => sum + Number(c.fuel_cost), 0);
  const yearToDate = utilityCosts.reduce((sum, cost) => sum + Number(cost.total_cost), 0);

  const changeFromPrevious = previousMonthTotal > 0 
    ? ((totalMonthly - previousMonthTotal) / previousMonthTotal) * 100 
    : 0;

  // Format monthly trend data (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const monthCosts = utilityCosts.filter(cost => 
      new Date(cost.cost_month).getMonth() === month.getMonth()
    );
    const power = monthCosts.reduce((sum, c) => sum + Number(c.electricity_cost), 0);
    const fuel = monthCosts.reduce((sum, c) => sum + Number(c.fuel_cost), 0);
    
    return {
      month: format(month, "MMM"),
      power,
      fuel,
      total: power + fuel
    };
  });

  // Cost breakdown for pie chart
  const costBreakdown = [
    { name: "Grid Power", value: powerCost, color: "hsl(var(--chart-1))" },
    { name: "Generator Fuel", value: fuelCost, color: "hsl(var(--chart-2))" },
  ];

  return (
    <div className="space-y-6">
      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalMonthly.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {changeFromPrevious > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              )}
              {Math.abs(changeFromPrevious).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{powerCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">62% of total cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{fuelCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">38% of total cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(yearToDate / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Total YTD spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trends and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cost Trend Analysis</CardTitle>
              <CardDescription>Monthly utility cost breakdown over time</CardDescription>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, ""]} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  name="Total Cost" 
                />
                <Line 
                  type="monotone" 
                  dataKey="power" 
                  stroke="hsl(var(--chart-1))" 
                  name="Power Cost" 
                />
                <Line 
                  type="monotone" 
                  dataKey="fuel" 
                  stroke="hsl(var(--chart-2))" 
                  name="Fuel Cost" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Current month distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bills and Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Utility Bills & Payments</CardTitle>
            <CardDescription>Track all utility-related expenses and payment status</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilityCosts.slice(0, 10).map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">UTIL-{cost.id.slice(0, 8)}</TableCell>
                  <TableCell>Utilities</TableCell>
                  <TableCell>Multiple</TableCell>
                  <TableCell>₦{Number(cost.total_cost).toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(cost.cost_month), "yyyy-MM-dd")}</TableCell>
                  <TableCell>
                    <Badge variant="default">recorded</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}