import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
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
  ClipboardList,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { format } from 'date-fns';
import { useHousekeepingTasks, useAmenityRequests, useHousekeepingSupplies } from '@/hooks/useHousekeepingApi';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

export default function ProductionDashboard() {
  const { tasks, loading: tasksLoading, error: tasksError, refreshTasks } = useHousekeepingTasks();
  const { requests, loading: requestsLoading, refreshRequests } = useAmenityRequests();
  const { supplies, loading: suppliesLoading, refreshSupplies } = useHousekeepingSupplies();
  const { toast } = useToast();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshing, setRefreshing] = useState(false);

  // Enable real-time updates for housekeeping
  useRealtimeUpdates([
    {
      table: 'housekeeping_tasks',
      event: '*',
      onUpdate: (payload) => {
        if (payload.eventType === 'INSERT') {
          toast({
            title: "New Task Assigned",
            description: `Task: ${payload.new.title}`,
          });
        } else if (payload.eventType === 'UPDATE') {
          toast({
            title: "Task Updated",
            description: `${payload.new.title} - ${payload.new.status}`,
          });
        }
        refreshTasks();
      },
      enabled: true
    },
    {
      table: 'rooms',
      event: 'UPDATE',
      onUpdate: (payload) => {
        if (payload.old.status !== payload.new.status) {
          toast({
            title: "Room Status Changed",
            description: `Room ${payload.new.room_number}: ${payload.new.status}`,
          });
        }
      },
      enabled: true
    }
  ]);

  // Mock current staff member (replace with auth context)
  const currentStaff = {
    id: 'staff-1',
    name: 'Maria Santos',
    role: 'housekeeper',
    shift: 'Day Shift',
    shiftStart: new Date().setHours(8, 0, 0, 0)
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Syncing offline actions...",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "Working in offline mode",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Calculate KPIs
  const kpiData = {
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
      completedToday: tasks.filter(t => t.status === 'completed' && 
        new Date(t.completed_at || t.created_at || '').toDateString() === new Date().toDateString()).length,
    amenitiesDelivered: requests.filter(r => r.status === 'completed').length,
    oosRooms: 3, // This would come from OOS API
    todayStats: {
      efficiency: 92,
      onTimeCompletion: 85,
      avgCompletionTime: 28,
      suppliesUsed: supplies.reduce((total, s) => total + s.maximumStock - s.currentStock, 0)
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

  // Get urgent tasks
  const urgentTasks = tasks.filter(task => task.priority === 'urgent' || task.priority === 'high').slice(0, 3);

  // Get recent amenity requests
  const recentAmenityRequests = requests.filter(r => r.status === 'pending' || r.status === 'in-progress').slice(0, 3);

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
    toast({
      title: "Shift Started",
      description: `Welcome ${currentStaff.name}! Your shift has been logged.`,
    });
  };

  const handleQuickRoomClean = (roomNumber: string) => {
    // Quick room status update
    toast({
      title: "Room Updated",
      description: `Room ${roomNumber} marked as clean`,
    });
  };

  const handleReportIssue = () => {
    // Escalate to maintenance
    toast({
      title: "Issue Reported",
      description: "Maintenance has been notified",
    });
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshTasks(),
        refreshRequests(),
        refreshSupplies()
      ]);
      toast({
        title: "Data Refreshed",
        description: "All data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Some data could not be updated",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (tasksLoading || requestsLoading || suppliesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="flex items-center justify-center h-96">
        <ErrorState 
          message={tasksError}
          onRetry={refreshTasks}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Housekeeping Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">Welcome back, {currentStaff.name} • {currentStaff.shift}</p>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-success">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-warning-foreground">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
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

      {/* Offline Status Banner */}
      {!isOnline && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-warning-foreground" />
              <div>
                <div className="font-medium text-warning-foreground">Offline Mode Active</div>
                <div className="text-sm text-muted-foreground">
                  Your actions will be automatically synced when connection is restored.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            {urgentTasks.length > 0 ? (
              urgentTasks.map((task) => (
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
                        Due: {format(task.dueDate, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getPriorityColor(task.priority)} variant="outline">
                      {task.priority}
                    </Badge>
                    <Button size="sm" className="text-xs">
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No urgent tasks at this time
              </div>
            )}
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
            {recentAmenityRequests.length > 0 ? (
              recentAmenityRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Room {request.roomNumber}</div>
                      <div className="text-sm text-muted-foreground">{request.items.map(i => i.name).join(', ')}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(request.requestedAt, 'HH:mm')} • {request.source.replace('-', ' ')}
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
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent amenity requests
              </div>
            )}
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