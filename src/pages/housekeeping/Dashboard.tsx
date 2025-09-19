import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Play,
  Users,
  Package,
  TrendingUp,
  Bell,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { useHousekeepingStats, useHousekeepingTasks } from '@/hooks/useApi';

export default function HousekeepingDashboard() {
  const { data: stats } = useHousekeepingStats();
  const { data: tasks } = useHousekeepingTasks();

  // Mock current staff member (replace with auth context)
  const currentStaff = {
    id: 'staff-1',
    name: 'Maria Santos',
    role: 'housekeeper',
    shift: 'Day Shift',
    shiftStart: new Date().setHours(8, 0, 0, 0)
  };

  // Mock data for KPIs
  const kpiData = {
    pendingTasks: 12,
    completedToday: 34,
    amenitiesDelivered: 18,
    oosRooms: 3,
    todayStats: {
      efficiency: 92,
      onTimeCompletion: 85,
      avgCompletionTime: 28,
      suppliesUsed: 156
    }
  };

  // Mock room heatmap data (organized by floor)
  const roomHeatmap = {
    floors: [
      {
        number: 3,
        rooms: [
          { number: '301', status: 'clean', priority: 'low' },
          { number: '302', status: 'in-progress', priority: 'medium' },
          { number: '303', status: 'dirty', priority: 'high' },
          { number: '304', status: 'clean', priority: 'low' },
          { number: '305', status: 'oos', priority: 'urgent' },
          { number: '306', status: 'clean', priority: 'low' },
          { number: '307', status: 'dirty', priority: 'medium' },
          { number: '308', status: 'in-progress', priority: 'medium' }
        ]
      },
      {
        number: 2,
        rooms: [
          { number: '201', status: 'clean', priority: 'low' },
          { number: '202', status: 'clean', priority: 'low' },
          { number: '203', status: 'dirty', priority: 'high' },
          { number: '204', status: 'clean', priority: 'low' },
          { number: '205', status: 'in-progress', priority: 'medium' },
          { number: '206', status: 'clean', priority: 'low' },
          { number: '207', status: 'clean', priority: 'low' },
          { number: '208', status: 'dirty', priority: 'medium' }
        ]
      }
    ]
  };

  // Mock urgent tasks
  const urgentTasks = [
    {
      id: 'task-1',
      roomNumber: '305',
      type: 'oos-cleaning',
      description: 'Deep clean after maintenance',
      priority: 'urgent',
      dueTime: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
      assignedTo: 'Maria Santos'
    },
    {
      id: 'task-2',
      roomNumber: '203',
      type: 'checkout-cleaning',
      description: 'Post-checkout cleaning',
      priority: 'high',
      dueTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      assignedTo: 'Sarah Johnson'
    }
  ];

  // Mock recent amenity requests
  const recentAmenityRequests = [
    {
      id: 'req-1',
      roomNumber: '308',
      items: ['Extra Towels (x2)', 'Baby Cot'],
      requestedBy: 'Guest QR',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      status: 'pending'
    },
    {
      id: 'req-2',
      roomNumber: '205',
      items: ['Extra Pillows', 'Blanket'],
      requestedBy: 'Front Desk',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      status: 'in-progress'
    }
  ];

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-success';
      case 'in-progress': return 'bg-primary';
      case 'dirty': return 'bg-warning';
      case 'oos': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleStartShift = () => {
    // Log shift start time
    console.log('Starting shift for', currentStaff.name);
  };

  const handleQuickRoomClean = (roomNumber: string) => {
    // Quick room status update
    console.log('Marking room clean:', roomNumber);
  };

  const handleReportIssue = () => {
    // Escalate to maintenance
    console.log('Reporting maintenance issue');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Housekeeping Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentStaff.name} • {currentStaff.shift}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleStartShift} className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Start Shift
          </Button>
          <Button variant="outline" onClick={handleReportIssue} className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{kpiData.pendingTasks}</div>
                <div className="text-sm text-muted-foreground">Pending Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{kpiData.completedToday}</div>
                <div className="text-sm text-muted-foreground">Completed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{kpiData.amenitiesDelivered}</div>
                <div className="text-sm text-muted-foreground">Amenities Delivered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{kpiData.oosRooms}</div>
                <div className="text-sm text-muted-foreground">OOS Rooms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Heatmap */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Room Status Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roomHeatmap.floors.map((floor) => (
              <div key={floor.number} className="space-y-2">
                <div className="text-sm font-medium">Floor {floor.number}</div>
                <div className="grid grid-cols-8 gap-2">
                  {floor.rooms.map((room) => (
                    <div key={room.number} className="relative group">
                      <div 
                        className={`h-10 w-10 rounded ${getRoomStatusColor(room.status)} flex items-center justify-center text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => handleQuickRoomClean(room.number)}
                      >
                        {room.number.slice(-2)}
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-background border rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs whitespace-nowrap">
                        Room {room.number} - {room.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-4 text-xs mt-4">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-success"></div>
                <span>Clean</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-primary"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-warning"></div>
                <span>Dirty</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-destructive"></div>
                <span>OOS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{kpiData.todayStats.efficiency}%</div>
                <div className="text-sm text-muted-foreground">Efficiency</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-success">{kpiData.todayStats.onTimeCompletion}%</div>
                <div className="text-sm text-muted-foreground">On-Time</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-accent-foreground">{kpiData.todayStats.avgCompletionTime}min</div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-warning-foreground">{kpiData.todayStats.suppliesUsed}</div>
                <div className="text-sm text-muted-foreground">Supplies Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Urgent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-destructive/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <div className="font-medium">Room {task.roomNumber}</div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      Due: {format(task.dueTime, 'HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getPriorityColor(task.priority)} variant="outline">
                    {task.priority}
                  </Badge>
                  <Button size="sm" className="text-xs">
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Amenity Requests */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Amenity Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAmenityRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Room {request.roomNumber}</div>
                    <div className="text-sm text-muted-foreground">{request.items.join(', ')}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(request.timestamp, 'HH:mm')} • {request.requestedBy}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={request.status === 'pending' ? 'outline' : 'secondary'}>
                    {request.status}
                  </Badge>
                  <Button size="sm" variant="outline" className="text-xs">
                    {request.status === 'pending' ? 'Accept' : 'Update'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2" onClick={() => window.location.href = '/housekeeping-dashboard/tasks'}>
              <ClipboardList className="h-6 w-6" />
              <span>View All Tasks</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2" onClick={() => window.location.href = '/housekeeping-dashboard/amenities'}>
              <Bell className="h-6 w-6" />
              <span>Amenity Requests</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2" onClick={() => window.location.href = '/housekeeping-dashboard/supplies'}>
              <Package className="h-6 w-6" />
              <span>Check Supplies</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2" onClick={handleReportIssue}>
              <AlertTriangle className="h-6 w-6" />
              <span>Report Issue</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}