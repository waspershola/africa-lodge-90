import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Bell,
  MapPin,
  Wrench
} from 'lucide-react';
import { useMaintenanceApi } from '@/hooks/useMaintenanceApi';

// This component shows how maintenance updates integrate with Front Desk operations
export default function FrontDeskIntegration() {
  const { workOrders } = useMaintenanceApi();
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-001',
      timestamp: '2024-01-19T15:30:00Z',
      type: 'maintenance_completed',
      workOrderId: 'WO308-02',
      roomId: '308',
      message: 'Shower leak repair completed - Room ready for occupancy',
      status: 'unread',
      priority: 'high'
    },
    {
      id: 'notif-002',
      timestamp: '2024-01-19T14:45:00Z',
      type: 'maintenance_started',
      workOrderId: 'WO205-01',
      roomId: '205',
      message: 'AC repair work started - Room temporarily unavailable',
      status: 'read',
      priority: 'medium'
    },
    {
      id: 'notif-003',
      timestamp: '2024-01-19T13:20:00Z',
      type: 'parts_ordered',
      workOrderId: 'WO-POOL-07',
      facility: 'Swimming Pool',
      message: 'Pool pump replacement parts ordered - ETA 2 days',
      status: 'read',
      priority: 'low'
    }
  ]);

  const [roomStatuses, setRoomStatuses] = useState([
    { roomId: '205', status: 'maintenance', workOrderId: 'WO205-01', issue: 'AC repair in progress' },
    { roomId: '308', status: 'ready', workOrderId: null, issue: null },
    { roomId: '412', status: 'inspection', workOrderId: 'WO412-03', issue: 'Post-repair inspection needed' },
    { roomId: '501', status: 'occupied', workOrderId: null, issue: null },
    { roomId: '502', status: 'dirty', workOrderId: null, issue: null }
  ]);

  // Simulate real-time updates from maintenance system
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate maintenance completion notifications
      if (Math.random() > 0.98) {
        const roomNumbers = ['205', '308', '412', '501', '502'];
        const randomRoom = roomNumbers[Math.floor(Math.random() * roomNumbers.length)];
        
        const newNotification = {
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'maintenance_completed',
          workOrderId: `WO${randomRoom}-${Math.floor(Math.random() * 10)}`,
          roomId: randomRoom,
          message: `Maintenance work completed in Room ${randomRoom} - Ready for occupancy`,
          status: 'unread',
          priority: 'high'
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        
        // Update room status
        setRoomStatuses(prev => prev.map(room => 
          room.roomId === randomRoom 
            ? { ...room, status: 'ready', workOrderId: null, issue: null }
            : room
        ));
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId 
        ? { ...notif, status: 'read' }
        : notif
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700 border-green-200';
      case 'maintenance': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'inspection': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'occupied': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'dirty': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'maintenance_completed': return CheckCircle;
      case 'maintenance_started': return Wrench;
      case 'parts_ordered': return AlertTriangle;
      default: return Bell;
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const maintenanceRooms = roomStatuses.filter(r => r.status === 'maintenance').length;
  const readyRooms = roomStatuses.filter(r => r.status === 'ready').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Front Desk Integration</h1>
          <p className="text-muted-foreground mt-1">
            Real-time maintenance updates for front desk operations
          </p>
        </div>
        <Button variant="outline" className="relative">
          <Bell className="h-4 w-4 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread Notifications</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rooms in Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{maintenanceRooms}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready for Occupancy</p>
                <p className="text-2xl font-bold text-green-600">{readyRooms}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Work Orders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {workOrders.filter(w => w.status !== 'completed').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Maintenance Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {notifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border ${
                        notification.status === 'unread' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      } cursor-pointer hover:shadow-sm transition-shadow`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${
                          notification.status === 'unread' ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {notification.workOrderId}
                            </span>
                            {notification.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-1">{notification.message}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {notification.roomId && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Room {notification.roomId}
                              </div>
                            )}
                            {notification.facility && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {notification.facility}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Room Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Room Maintenance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {roomStatuses.map(room => (
                <div 
                  key={room.roomId}
                  className={`p-4 rounded-lg border ${getStatusColor(room.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Room {room.roomId}</span>
                    <Badge variant="outline" className="text-xs">
                      {room.status}
                    </Badge>
                  </div>
                  {room.issue && (
                    <p className="text-sm mb-2">{room.issue}</p>
                  )}
                  {room.workOrderId && (
                    <p className="text-xs font-mono">{room.workOrderId}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Real-time Updates</span>
              </div>
              <p className="text-sm text-green-600">
                Maintenance status changes immediately notify front desk
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Room Status Sync</span>
              </div>
              <p className="text-sm text-green-600">
                Room availability updated automatically
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Audit Trail</span>
              </div>
              <p className="text-sm text-green-600">
                All status changes logged for accountability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}