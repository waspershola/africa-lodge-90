import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Leaf, Target, TrendingUp, Lightbulb, Settings, Award, Zap } from "lucide-react";

const mockEfficiencyData = {
  overallScore: 78,
  carbonFootprint: 24.5,
  energyIntensity: 32.1,
  renewablePercentage: 15,
  costPerRoom: 2850,
  benchmarkScore: 82,
};

const mockDepartmentEfficiency = [
  { department: "Guest Rooms", efficiency: 85, consumption: 45, target: 40, savings: 12 },
  { department: "Kitchen", efficiency: 72, consumption: 28, target: 25, savings: 8 },
  { department: "Lobby & Common", efficiency: 68, consumption: 15, target: 12, savings: 5 },
  { department: "HVAC Systems", efficiency: 75, consumption: 35, target: 30, savings: 15 },
  { department: "Lighting", efficiency: 82, consumption: 12, target: 10, savings: 18 },
];

const mockMonthlyEfficiency = [
  { month: "Jul", score: 72, baseline: 70, target: 80 },
  { month: "Aug", score: 74, baseline: 70, target: 80 },
  { month: "Sep", score: 76, baseline: 70, target: 80 },
  { month: "Oct", score: 75, baseline: 70, target: 80 },
  { month: "Nov", score: 78, baseline: 70, target: 80 },
  { month: "Dec", score: 78, baseline: 70, target: 80 },
];

const mockRecommendations = [
  {
    id: 1,
    category: "HVAC Optimization",
    title: "Install Smart Thermostats",
    impact: "High",
    savings: "₦45,000/month",
    payback: "8 months",
    description: "Implement smart thermostats in guest rooms for automated temperature control"
  },
  {
    id: 2,
    category: "Lighting",
    title: "LED Retrofit Program",
    impact: "Medium", 
    savings: "₦28,000/month",
    payback: "12 months",
    description: "Replace remaining fluorescent lights with LED fixtures"
  },
  {
    id: 3,
    category: "Power Management",
    title: "Power Factor Correction",
    impact: "Medium",
    savings: "₦18,000/month",
    payback: "6 months",
    description: "Install capacitor banks to improve power factor and reduce penalties"
  }
];

export default function EnergyEfficiencyMetrics() {
  return (
    <div className="space-y-6">
      {/* Efficiency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEfficiencyData.overallScore}/100</div>
            <Progress value={mockEfficiencyData.overallScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {mockEfficiencyData.benchmarkScore}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
            <Leaf className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEfficiencyData.carbonFootprint} tCO₂</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              12% reduction this year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Intensity</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEfficiencyData.energyIntensity} kWh/m²</div>
            <p className="text-xs text-muted-foreground">Per square meter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Room</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{mockEfficiencyData.costPerRoom.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly average</p>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Trend</CardTitle>
          <CardDescription>Monthly energy efficiency performance vs targets</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={mockMonthlyEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                name="Current Score" 
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="hsl(var(--chart-2))" 
                strokeDasharray="5 5"
                name="Target Score" 
              />
              <Line 
                type="monotone" 
                dataKey="baseline" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2"
                name="Baseline" 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Efficiency Performance</CardTitle>
          <CardDescription>Energy efficiency by department with targets and savings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Efficiency Score</TableHead>
                <TableHead>Consumption (kWh)</TableHead>
                <TableHead>Target (kWh)</TableHead>
                <TableHead>Savings (%)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDepartmentEfficiency.map((dept) => (
                <TableRow key={dept.department}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{dept.efficiency}%</span>
                      <Progress value={dept.efficiency} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{dept.consumption}</TableCell>
                  <TableCell>{dept.target}</TableCell>
                  <TableCell>{dept.savings}%</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        dept.efficiency >= 80 ? "default" : 
                        dept.efficiency >= 70 ? "secondary" : "destructive"
                      }
                    >
                      {dept.efficiency >= 80 ? "Excellent" : 
                       dept.efficiency >= 70 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Efficiency Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Energy Efficiency Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions to improve energy performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant="outline">{rec.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Impact: <Badge variant="secondary" className="ml-1">{rec.impact}</Badge>
                      </span>
                      <span>Savings: {rec.savings}</span>
                      <span>Payback: {rec.payback}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button size="sm">Implement</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}