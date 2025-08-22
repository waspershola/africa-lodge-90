import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Bed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OccupancyReportsProps {
  dateRange: { from: Date; to: Date };
  period: string;
}

export default function OccupancyReports({ dateRange, period }: OccupancyReportsProps) {
  // Mock occupancy data
  const occupancyTrends = [
    { date: '2024-01-01', occupancy: 72, available: 120, occupied: 86 },
    { date: '2024-01-02', occupancy: 78, available: 120, occupied: 94 },
    { date: '2024-01-03', occupancy: 85, available: 120, occupied: 102 },
    { date: '2024-01-04', occupancy: 91, available: 120, occupied: 109 },
    { date: '2024-01-05', occupancy: 88, available: 120, occupied: 106 },
    { date: '2024-01-06', occupancy: 95, available: 120, occupied: 114 },
    { date: '2024-01-07', occupancy: 89, available: 120, occupied: 107 }
  ];

  const roomTypeOccupancy = [
    { type: 'Standard', occupied: 45, total: 60, rate: 75 },
    { type: 'Deluxe', occupied: 28, total: 35, rate: 80 },
    { type: 'Suite', occupied: 18, total: 20, rate: 90 },
    { type: 'Presidential', occupied: 3, total: 5, rate: 60 }
  ];

  const monthlyComparison = [
    { month: 'Jan', current: 78, previous: 72 },
    { month: 'Feb', current: 82, previous: 76 },
    { month: 'Mar', current: 85, previous: 79 },
    { month: 'Apr', current: 88, previous: 83 },
    { month: 'May', current: 92, previous: 87 },
    { month: 'Jun', current: 89, previous: 85 }
  ];

  const occupancyBySource = [
    { name: 'Direct Booking', value: 35, color: '#0088FE' },
    { name: 'Online Travel Agents', value: 28, color: '#00C49F' },
    { name: 'Walk-ins', value: 15, color: '#FFBB28' },
    { name: 'Corporate', value: 12, color: '#FF8042' },
    { name: 'Group Bookings', value: 10, color: '#8884D8' }
  ];

  return (
    <div className="space-y-6">
      {/* Occupancy Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5%</div>
            <p className="text-xs text-muted-foreground">94 of 120 rooms occupied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Length of Stay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 nights</div>
            <p className="text-xs text-muted-foreground">+0.2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">-0.8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Occupancy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground">Reached 3 times this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Trends</CardTitle>
          <CardDescription>
            Daily occupancy rates over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={occupancyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === 'occupancy' ? `${value}%` : value,
                  name === 'occupancy' ? 'Occupancy Rate' : 'Rooms'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="occupancy" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="occupancy"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Room Type Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy by Room Type</CardTitle>
            <CardDescription>
              Current occupancy rates by room category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomTypeOccupancy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'rate' ? `${value}%` : value,
                    name === 'rate' ? 'Occupancy Rate' : 'Rooms'
                  ]}
                />
                <Bar dataKey="rate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {roomTypeOccupancy.map((room, index) => (
                <div key={room.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{room.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {room.occupied}/{room.total}
                    </span>
                    <Badge variant={room.rate > 85 ? "default" : room.rate > 70 ? "secondary" : "outline"}>
                      {room.rate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Source</CardTitle>
            <CardDescription>
              Distribution of bookings by channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {occupancyBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
          <CardDescription>
            Monthly occupancy comparison with previous year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="current" fill="#8884d8" name="Current Year" />
              <Bar dataKey="previous" fill="#82ca9d" name="Previous Year" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}