import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, MapPin, Calendar, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GuestDemographicsProps {
  dateRange: { from: Date; to: Date };
  period: string;
}

export default function GuestDemographics({ dateRange, period }: GuestDemographicsProps) {
  // Mock guest demographics data
  const ageDistribution = [
    { ageGroup: '18-25', count: 45, percentage: 12.8 },
    { ageGroup: '26-35', count: 98, percentage: 27.9 },
    { ageGroup: '36-45', count: 87, percentage: 24.7 },
    { ageGroup: '46-55', count: 76, percentage: 21.6 },
    { ageGroup: '56-65', count: 32, percentage: 9.1 },
    { ageGroup: '65+', count: 14, percentage: 4.0 }
  ];

  const guestOrigins = [
    { country: 'Nigeria', guests: 156, percentage: 44.3, color: '#0088FE' },
    { country: 'Ghana', guests: 48, percentage: 13.6, color: '#00C49F' },
    { country: 'South Africa', guests: 42, percentage: 11.9, color: '#FFBB28' },
    { country: 'Kenya', guests: 35, percentage: 9.9, color: '#FF8042' },
    { country: 'UK', guests: 28, percentage: 8.0, color: '#8884D8' },
    { country: 'USA', guests: 25, percentage: 7.1, color: '#82CA9D' },
    { country: 'Others', guests: 18, percentage: 5.1, color: '#FFC0CB' }
  ];

  const bookingPurpose = [
    { purpose: 'Business', count: 142, percentage: 40.3 },
    { purpose: 'Leisure', count: 98, percentage: 27.8 },
    { purpose: 'Conference/Event', count: 56, percentage: 15.9 },
    { purpose: 'Wedding/Celebration', count: 34, percentage: 9.7 },
    { purpose: 'Medical/Health', count: 22, percentage: 6.3 }
  ];

  const stayDuration = [
    { duration: '1 Night', count: 78, percentage: 22.2 },
    { duration: '2-3 Nights', count: 145, percentage: 41.2 },
    { duration: '4-7 Nights', count: 89, percentage: 25.3 },
    { duration: '1-2 Weeks', count: 28, percentage: 8.0 },
    { duration: '2+ Weeks', count: 12, percentage: 3.4 }
  ];

  const monthlyGuestTrends = [
    { month: 'Jan', domestic: 120, international: 45, returning: 35 },
    { month: 'Feb', domestic: 135, international: 52, returning: 42 },
    { month: 'Mar', domestic: 142, international: 58, returning: 48 },
    { month: 'Apr', domestic: 156, international: 64, returning: 52 },
    { month: 'May', domestic: 168, international: 72, returning: 58 },
    { month: 'Jun', domestic: 145, international: 68, returning: 54 }
  ];

  const guestSatisfaction = [
    { rating: '5 Stars', count: 156, percentage: 44.3 },
    { rating: '4 Stars', count: 128, percentage: 36.4 },
    { rating: '3 Stars', count: 45, percentage: 12.8 },
    { rating: '2 Stars', count: 18, percentage: 5.1 },
    { rating: '1 Star', count: 5, percentage: 1.4 }
  ];

  const repeatGuestRate = [
    { month: 'Jan', newGuests: 145, returningGuests: 35, repeatRate: 19.4 },
    { month: 'Feb', newGuests: 152, returningGuests: 42, repeatRate: 21.6 },
    { month: 'Mar', newGuests: 168, returningGuests: 48, repeatRate: 22.2 },
    { month: 'Apr', newGuests: 175, returningGuests: 52, repeatRate: 22.9 },
    { month: 'May', newGuests: 185, returningGuests: 58, repeatRate: 23.9 },
    { month: 'Jun', newGuests: 178, returningGuests: 54, repeatRate: 23.3 }
  ];

  return (
    <div className="space-y-6">
      {/* Demographics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">352</div>
            <p className="text-xs text-muted-foreground">+18.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">International</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">196</div>
            <p className="text-xs text-muted-foreground">55.7% of total guests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8 nights</div>
            <p className="text-xs text-muted-foreground">+0.3 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Rate</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23.3%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Guest Origins Map */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Origins</CardTitle>
          <CardDescription>
            Geographic distribution of guests by country
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={guestOrigins}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="percentage"
                  label={({ country, percentage }) => `${country} ${percentage.toFixed(1)}%`}
                >
                  {guestOrigins.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {guestOrigins.map((origin, index) => (
                <div key={origin.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: origin.color }}
                    />
                    <span className="text-sm font-medium">{origin.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {origin.guests} guests
                    </span>
                    <Badge variant="outline">
                      {origin.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>
              Guest distribution by age groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageGroup" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {ageDistribution.map((age) => (
                <div key={age.ageGroup} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{age.ageGroup} years</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {age.count} guests
                    </span>
                    <Badge variant="outline">
                      {age.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Purpose */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Purpose</CardTitle>
            <CardDescription>
              Primary reason for hotel visits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingPurpose} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="purpose" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Guest Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Guest Trends</CardTitle>
          <CardDescription>
            Guest composition trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyGuestTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="domestic" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Domestic Guests"
              />
              <Line 
                type="monotone" 
                dataKey="international" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="International Guests"
              />
              <Line 
                type="monotone" 
                dataKey="returning" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Returning Guests"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stay Duration */}
        <Card>
          <CardHeader>
            <CardTitle>Stay Duration</CardTitle>
            <CardDescription>
              Distribution of guest stay lengths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stayDuration.map((duration, index) => (
                <div key={duration.duration} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{duration.duration}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {duration.count} guests
                      </span>
                      <Badge variant="outline">
                        {duration.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${duration.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guest Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Satisfaction</CardTitle>
            <CardDescription>
              Distribution of guest ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {guestSatisfaction.map((satisfaction, index) => (
                <div key={satisfaction.rating} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{satisfaction.rating}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {satisfaction.count} reviews
                      </span>
                      <Badge 
                        variant={index < 2 ? "default" : index < 3 ? "secondary" : "destructive"}
                      >
                        {satisfaction.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index < 2 ? 'bg-green-500' : 
                        index < 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${satisfaction.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repeat Guest Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Repeat Guest Analysis</CardTitle>
          <CardDescription>
            New vs returning guest trends and repeat rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={repeatGuestRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar 
                yAxisId="left"
                dataKey="newGuests" 
                fill="#8884d8" 
                name="New Guests"
              />
              <Bar 
                yAxisId="left"
                dataKey="returningGuests" 
                fill="#82ca9d" 
                name="Returning Guests"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="repeatRate" 
                stroke="#ff7300" 
                strokeWidth={2}
                name="Repeat Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}