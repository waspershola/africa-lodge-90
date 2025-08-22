import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Download } from "lucide-react";
import { useState } from "react";

const mockCostData = {
  totalMonthly: 450000,
  powerCost: 280000,
  fuelCost: 170000,
  previousMonth: 420000,
  yearToDate: 4800000,
};

const mockMonthlyTrend = [
  { month: "Jul", power: 250000, fuel: 150000, total: 400000 },
  { month: "Aug", power: 265000, fuel: 155000, total: 420000 },
  { month: "Sep", power: 270000, fuel: 160000, total: 430000 },
  { month: "Oct", power: 275000, fuel: 165000, total: 440000 },
  { month: "Nov", power: 280000, fuel: 170000, total: 450000 },
  { month: "Dec", power: 285000, fuel: 175000, total: 460000 },
];

const mockCostBreakdown = [
  { name: "Grid Power", value: 180000, color: "hsl(var(--chart-1))" },
  { name: "Generator Fuel", value: 170000, color: "hsl(var(--chart-2))" },
  { name: "Generator Maintenance", value: 45000, color: "hsl(var(--chart-3))" },
  { name: "Power Factor Penalty", value: 25000, color: "hsl(var(--chart-4))" },
  { name: "Demand Charges", value: 30000, color: "hsl(var(--chart-5))" },
];

const mockBills = [
  { id: 1, type: "Electricity", provider: "EKEDC", amount: 180000, dueDate: "2024-02-15", status: "paid", billNo: "EKD2024001" },
  { id: 2, type: "Generator Fuel", provider: "Shell Nigeria", amount: 120000, dueDate: "2024-02-10", status: "paid", billNo: "SHL2024015" },
  { id: 3, type: "Maintenance", provider: "PowerGen Services", amount: 45000, dueDate: "2024-02-20", status: "pending", billNo: "PGS2024005" },
  { id: 4, type: "Gas Supply", provider: "Total Gas", amount: 35000, dueDate: "2024-02-25", status: "overdue", billNo: "TGL2024008" },
];

export default function UtilityCostTracking() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const changeFromPrevious = ((mockCostData.totalMonthly - mockCostData.previousMonth) / mockCostData.previousMonth) * 100;

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
            <div className="text-2xl font-bold">₦{mockCostData.totalMonthly.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">₦{mockCostData.powerCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">62% of total cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{mockCostData.fuelCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">38% of total cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(mockCostData.yearToDate / 1000000).toFixed(1)}M</div>
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
              <LineChart data={mockMonthlyTrend}>
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
                  data={mockCostBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockCostBreakdown.map((entry, index) => (
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
              {mockBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNo}</TableCell>
                  <TableCell>{bill.type}</TableCell>
                  <TableCell>{bill.provider}</TableCell>
                  <TableCell>₦{bill.amount.toLocaleString()}</TableCell>
                  <TableCell>{bill.dueDate}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        bill.status === "paid" ? "default" : 
                        bill.status === "pending" ? "secondary" : "destructive"
                      }
                    >
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">View</Button>
                      {bill.status !== "paid" && (
                        <Button variant="ghost" size="sm">Pay</Button>
                      )}
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