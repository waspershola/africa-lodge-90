import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'qr_request' | 'maintenance_urgent' | 'checkout_ready' | 'audit_alert' | 'reservation_change';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user, tenant } = useMultiTenantAuth();

  // Phase 1: Enable unified real-time updates
  useUnifiedRealtime({ verbose: false });

  const addNotification = (notificationData: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
      ...notificationData
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'qr_request':
        return <User className="h-4 w-4" />;
      case 'maintenance_urgent':
        return <AlertCircle className="h-4 w-4" />;
      case 'checkout_ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'audit_alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-muted/50' 
                      : 'bg-background border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at))} ago
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}