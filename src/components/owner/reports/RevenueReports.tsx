import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RevenueReportsProps {
  dateRange: { from: Date; to: Date };
  period: string;
}

export default function RevenueReports({ dateRange, period }: RevenueReportsProps) {
  // Mock revenue data
  const revenueData = [
    { date: '2024-01-01', rooms: 185000, services: 45000, total: 230000 },
    { date: '2024-01-02', rooms: 198000, services: 52000, total: 250000 },
    { date: '2024-01-03', rooms: 212000, services: 48000, total: 260000 },
    { date: '2024-01-04', rooms: 225000, services: 58000, total: 283000 },
    { date: '2024-01-05', rooms: 201000, services: 43000, total: 244000 },
    { date: '2024-01-06', rooms: 234000, services: 67000, total: 301000 },
    { date: '2024-01-07', rooms: 218000, services: 55000, total: 273000 }
  ];

  const roomTypeRevenue = [
    { type: 'Standard', revenue: 2850000, percentage: 45.2 },
    { type: 'Deluxe', revenue: 2125000, percentage: 33.7 },
    { type: 'Suite', revenue: 1140000, percentage: 18.1 },
    { type: 'Presidential', revenue: 189000, percentage: 3.0 }
  ];

  const serviceRevenue = [
    { service: 'Room Service', amount: 425000, percentage: 32.1 },
    { service: 'Restaurant', amount: 380000, percentage: 28.7 },
    { service: 'Spa Services', amount: 285000, percentage: 21.5 },
    { service: 'Laundry', amount: 145000, percentage: 11.0 },
    { service: 'Others', amount: 89000, percentage: 6.7 }
  ];

  const paymentMethods = [
    { method: 'Credit Card', amount: 1850000, percentage: 68.5, color: '#0088FE' },
    { method: 'Cash', amount: 485000, percentage: 18.0, color: '#00C49F' },
    { method: 'Bank Transfer', amount: 285000, percentage: 10.5, color: '#FFBB28' },
    { method: 'Mobile Payment', amount: 81000, percentage: 3.0, color: '#FF8042' }
  ];

  const monthlyTrends = [
    { month: 'Jan', revenue: 6800000, target: 6500000, growth: 12.5 },
    { month: 'Feb', revenue: 7200000, target: 6800000, growth: 8.9 },
    { month: 'Mar', revenue: 7850000, target: 7200000, growth: 15.2 },
    { month: 'Apr', revenue: 8200000, target: 7800000, growth: 11.7 },
    { month: 'May', revenue: 8950000, target: 8500000, growth: 18.3 },
    { month: 'Jun', revenue: 8650000, target: 8800000, growth: -1.7 }
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦8.65M</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦2,450</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RevPAR</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦1,923</div>
            <p className="text-xs text-muted-foreground">+8.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦1.32M</div>
            <p className="text-xs text-muted-foreground">+18.7% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>
            Daily revenue breakdown by source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tickFormatter={(value: number) => `₦${(value / 1000)}K`} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `₦${((value as number) / 1000).toLocaleString()}K`, 
                    name === 'rooms' ? 'Room Revenue' : 
                    name === 'services' ? 'Service Revenue' : 'Total Revenue'
                  ]}
                />
              <Area 
                type="monotone" 
                dataKey="rooms" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="services" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#ff7300" 
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Room Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Type</CardTitle>
            <CardDescription>
              Revenue distribution across room categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomTypeRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis tickFormatter={(value: number) => `₦${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value: any) => [`₦${((value as number) / 1000000).toFixed(2)}M`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {roomTypeRevenue.map((room) => (
                <div key={room.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{room.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ₦{(room.revenue / 1000000).toFixed(2)}M
                    </span>
                    <Badge variant="outline">
                      {room.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
            <CardDescription>
              Payment method distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  label={({ method, percentage }) => `${method} ${percentage.toFixed(1)}%`}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `₦${(props.payload.amount / 1000000).toFixed(2)}M`,
                  'Revenue'
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Service Revenue Breakdown</CardTitle>
          <CardDescription>
            Revenue from additional services and amenities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceRevenue.map((service, index) => (
              <div key={service.service} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{service.service}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ₦{(service.amount / 1000).toLocaleString()}K
                    </span>
                    <Badge variant="outline">
                      {service.percentage}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${service.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue vs Target */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance vs Target</CardTitle>
          <CardDescription>
            Revenue performance against monthly targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value: number) => `₦${(value / 1000000).toFixed(1)}M`} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'growth' ? `${value}%` : `₦${((value as number) / 1000000).toFixed(2)}M`,
                  name === 'revenue' ? 'Actual Revenue' : 
                  name === 'target' ? 'Target Revenue' : 'Growth %'
                ]}
              />
              <Bar yAxisId="left" dataKey="target" fill="#e0e0e0" name="target" />
              <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="revenue" />
              <Line 
                type="monotone" 
                dataKey="growth" 
                stroke="#ff7300" 
                strokeWidth={2}
                yAxisId="right"
                name="growth"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}