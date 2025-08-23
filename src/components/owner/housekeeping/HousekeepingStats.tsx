import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target
} from 'lucide-react';

export default function HousekeepingStats() {
  // Mock analytics data
  const performanceData = {
    todayStats: {
      tasksCompleted: 18,
      averageCompletionTime: 42,
      onTimeCompletion: 85,
      delayedTasks: 3
    },
    weeklyStats: {
      totalTasks: 126,
      completionRate: 92,
      averageRating: 4.6,
      costSavings: 125000
    },
    staffPerformance: [
      { name: 'Maria Santos', tasks: 8, rating: 4.8, efficiency: 95 },
      { name: 'John Doe', tasks: 6, rating: 4.5, efficiency: 88 },
      { name: 'Sarah Johnson', tasks: 4, rating: 4.7, efficiency: 92 }
    ],
    roomTypes: [
      { type: 'Standard', completed: 12, pending: 3, avgTime: 35 },
      { type: 'Deluxe', completed: 8, pending: 2, avgTime: 45 },
      { type: 'Suite', completed: 4, pending: 1, avgTime: 65 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Today's Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{performanceData.todayStats.tasksCompleted}</div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{performanceData.todayStats.averageCompletionTime}min</div>
                  <div className="text-sm text-muted-foreground">Avg Completion</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{performanceData.todayStats.onTimeCompletion}%</div>
                  <div className="text-sm text-muted-foreground">On-Time Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{performanceData.todayStats.delayedTasks}</div>
                  <div className="text-sm text-muted-foreground">Delayed Tasks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">This Week's Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  +12%
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{performanceData.weeklyStats.totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  +5%
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{performanceData.weeklyStats.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  +0.2
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{performanceData.weeklyStats.averageRating}</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-success">Efficiency</div>
              </div>
              <div className="text-2xl font-bold mb-1">₦{(performanceData.weeklyStats.costSavings / 1000).toFixed(0)}K</div>
              <div className="text-sm text-muted-foreground">Cost Savings</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Staff Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Staff Performance</h3>
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {performanceData.staffPerformance.map((staff, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-sm text-muted-foreground">{staff.tasks} tasks today</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{staff.rating}</div>
                      <div className="text-muted-foreground">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{staff.efficiency}%</div>
                      <div className="text-muted-foreground">Efficiency</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Type Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Room Type Performance</h3>
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {performanceData.roomTypes.map((room, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{room.type} Rooms</div>
                    <div className="text-sm text-muted-foreground">Average: {room.avgTime} minutes</div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-success">{room.completed}</div>
                      <div className="text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-warning-foreground">{room.pending}</div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}