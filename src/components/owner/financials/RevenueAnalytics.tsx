import { useState } from "react";
import { Calendar, Download, Filter, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const revenueData = [
  { date: 'Jan 1', revenue: 12500, occupancy: 85, adr: 185 },
  { date: 'Jan 2', revenue: 14200, occupancy: 92, adr: 195 },
  { date: 'Jan 3', revenue: 11800, occupancy: 78, adr: 175 },
  { date: 'Jan 4', revenue: 15600, occupancy: 96, adr: 205 },
  { date: 'Jan 5', revenue: 13900, occupancy: 89, adr: 190 },
  { date: 'Jan 6', revenue: 16200, occupancy: 98, adr: 210 },
  { date: 'Jan 7', revenue: 14700, occupancy: 91, adr: 198 }
];

const roomTypeRevenue = [
  { name: 'Standard', revenue: 45600, percentage: 45, color: '#1A237E' },
  { name: 'Deluxe', revenue: 38400, percentage: 38, color: '#3949AB' },
  { name: 'Suite', revenue: 17000, percentage: 17, color: '#FFD700' }
];

const serviceRevenue = [
  { service: 'Room Revenue', amount: 101000, growth: 12.5 },
  { service: 'Food & Beverage', amount: 28500, growth: 8.2 },
  { service: 'Spa Services', amount: 12400, growth: -3.1 },
  { service: 'Laundry', amount: 5600, growth: 15.7 },
  { service: 'Room Service', amount: 8900, growth: 22.3 }
];

const monthlyMetrics = [
  { month: 'Dec', revpar: 142, adr: 185, occupancy: 78 },
  { month: 'Jan', revpar: 158, adr: 195, occupancy: 85 },
  { month: 'Feb', revpar: 165, adr: 198, occupancy: 88 },
  { month: 'Mar', revpar: 172, adr: 205, occupancy: 90 }
];

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState<any>({ from: new Date(2024, 0, 1), to: new Date(2024, 0, 7) });
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTotalRevenue = () => {
    return revenueData.reduce((sum, day) => sum + day.revenue, 0);
  };

  const getAverageADR = () => {
    const total = revenueData.reduce((sum, day) => sum + day.adr, 0);
    return (total / revenueData.length).toFixed(0);
  };

  const getAverageOccupancy = () => {
    const total = revenueData.reduce((sum, day) => sum + day.occupancy, 0);
    return (total / revenueData.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <DatePickerWithRange 
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(getTotalRevenue())}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${getAverageADR()}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8.2% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{getAverageOccupancy()}%</div>
            <div className="flex items-center text-xs text-destructive">
              <TrendingDown className="mr-1 h-3 w-3" />
              -2.1% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RevPAR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$165</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +15.8% vs last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue and key metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#1A237E" strokeWidth={2} />
              <Line type="monotone" dataKey="adr" stroke="#FFD700" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Type Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Type</CardTitle>
            <CardDescription>Breakdown of revenue by room category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roomTypeRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="revenue"
                >
                  {roomTypeRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {roomTypeRevenue.map((room) => (
                <div key={room.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: room.color }} />
                    <span className="text-sm">{room.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(room.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{room.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Performance of different revenue streams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceRevenue.map((service) => (
                <div key={service.service} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{service.service}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(service.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={service.growth > 0 ? "default" : "destructive"}>
                      {service.growth > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(service.growth)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Metrics</CardTitle>
          <CardDescription>Monthly comparison of RevPAR, ADR, and Occupancy</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revpar" fill="#1A237E" name="RevPAR" />
              <Bar dataKey="adr" fill="#3949AB" name="ADR" />
              <Bar dataKey="occupancy" fill="#FFD700" name="Occupancy %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}