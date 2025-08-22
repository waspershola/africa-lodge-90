import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Users, Clock, Star, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface StaffPerformanceReportsProps {
  dateRange: { from: Date; to: Date };
  period: string;
}

export default function StaffPerformanceReports({ dateRange, period }: StaffPerformanceReportsProps) {
  // Mock staff performance data
  const topPerformers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Front Desk Manager',
      checkins: 145,
      satisfaction: 4.8,
      efficiency: 92,
      avatar: 'SJ'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Front Desk Agent',
      checkins: 132,
      satisfaction: 4.6,
      efficiency: 88,
      avatar: 'MC'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Concierge',
      checkins: 98,
      satisfaction: 4.9,
      efficiency: 95,
      avatar: 'ER'
    },
    {
      id: 4,
      name: 'James Wilson',
      role: 'Night Manager',
      checkins: 76,
      satisfaction: 4.4,
      efficiency: 85,
      avatar: 'JW'
    }
  ];

  const departmentPerformance = [
    { department: 'Front Desk', efficiency: 89, satisfaction: 4.6, tasks: 450 },
    { department: 'Housekeeping', efficiency: 92, satisfaction: 4.4, tasks: 380 },
    { department: 'Concierge', efficiency: 87, satisfaction: 4.8, tasks: 165 },
    { department: 'Maintenance', efficiency: 91, satisfaction: 4.3, tasks: 98 },
    { department: 'Food Service', efficiency: 85, satisfaction: 4.5, tasks: 275 }
  ];

  const dailyProductivity = [
    { date: '2024-01-01', checkIns: 35, checkOuts: 28, services: 42 },
    { date: '2024-01-02', checkIns: 41, checkOuts: 35, services: 48 },
    { date: '2024-01-03', checkIns: 38, checkOuts: 31, services: 45 },
    { date: '2024-01-04', checkIns: 44, checkOuts: 38, services: 52 },
    { date: '2024-01-05', checkIns: 39, checkOuts: 33, services: 46 },
    { date: '2024-01-06', checkIns: 47, checkOuts: 41, services: 55 },
    { date: '2024-01-07', checkIns: 42, checkOuts: 36, services: 49 }
  ];

  const shiftPerformance = [
    { shift: 'Morning (6-14)', staff: 12, efficiency: 91, incidents: 2 },
    { shift: 'Afternoon (14-22)', staff: 15, efficiency: 87, incidents: 4 },
    { shift: 'Night (22-6)', staff: 8, efficiency: 85, incidents: 1 }
  ];

  const skillsRadarData = [
    { skill: 'Customer Service', frontDesk: 90, housekeeping: 85, concierge: 95 },
    { skill: 'Efficiency', frontDesk: 88, housekeeping: 92, concierge: 87 },
    { skill: 'Problem Solving', frontDesk: 86, housekeeping: 78, concierge: 91 },
    { skill: 'Communication', frontDesk: 92, housekeeping: 80, concierge: 94 },
    { skill: 'Reliability', frontDesk: 89, housekeeping: 94, concierge: 88 },
    { skill: 'Teamwork', frontDesk: 87, housekeeping: 89, concierge: 85 }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88.7%</div>
            <p className="text-xs text-muted-foreground">+3.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6/5.0</div>
            <p className="text-xs text-muted-foreground">+0.2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 min</div>
            <p className="text-xs text-muted-foreground">-0.5 min improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>
            Highest performing staff members this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((staff, index) => (
              <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{staff.avatar}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className="font-semibold">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">{staff.role}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="font-semibold">{staff.checkins}</div>
                    <div className="text-xs text-muted-foreground">Check-ins</div>
                  </div>
                  <div>
                    <div className="font-semibold">{staff.satisfaction}⭐</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div>
                    <div className="font-semibold">{staff.efficiency}%</div>
                    <div className="text-xs text-muted-foreground">Efficiency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Productivity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Productivity Trends</CardTitle>
          <CardDescription>
            Daily task completion across different activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyProductivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="checkIns" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Check-ins"
              />
              <Line 
                type="monotone" 
                dataKey="checkOuts" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Check-outs"
              />
              <Line 
                type="monotone" 
                dataKey="services" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Services"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>
              Performance metrics by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="department" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#8884d8" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-3">
              {departmentPerformance.map((dept) => (
                <div key={dept.department} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dept.department}</span>
                    <span>{dept.satisfaction}⭐</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={dept.efficiency} className="flex-1" />
                    <span className="text-xs text-muted-foreground w-12">
                      {dept.efficiency}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Assessment</CardTitle>
            <CardDescription>
              Comparative skills analysis by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Front Desk"
                  dataKey="frontDesk"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Housekeeping"
                  dataKey="housekeeping"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Concierge"
                  dataKey="concierge"
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Shift Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Performance Analysis</CardTitle>
          <CardDescription>
            Performance comparison across different work shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {shiftPerformance.map((shift) => (
              <Card key={shift.shift}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{shift.shift}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Staff Count</span>
                    <Badge variant="outline">{shift.staff}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Efficiency</span>
                      <span className="text-sm font-medium">{shift.efficiency}%</span>
                    </div>
                    <Progress value={shift.efficiency} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Incidents</span>
                    <Badge variant={shift.incidents <= 2 ? "default" : "destructive"}>
                      {shift.incidents}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}