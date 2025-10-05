import { CheckCircle, X, Clock, User, AlertCircle, CreditCard, Wrench, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { StaffNotification } from '@/hooks/useStaffNotifications';
import { Badge } from '@/components/ui/badge';

interface NotificationListProps {
  notifications: StaffNotification[];
  isLoading: boolean;
  onAcknowledge: (id: string) => void;
  onComplete: (id: string) => void;
}

export function NotificationList({
  notifications,
  isLoading,
  onAcknowledge,
  onComplete
}: NotificationListProps) {
  
  const getNotificationIcon = (type: StaffNotification['notification_type']) => {
    const iconClass = "h-4 w-4 text-white";
    switch (type) {
      case 'guest_request':
        return <User className={iconClass} />;
      case 'maintenance':
        return <Wrench className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'checkout':
        return <LogOut className={iconClass} />;
      case 'checkin':
        return <LogIn className={iconClass} />;
      case 'alert':
        return <AlertCircle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getPriorityConfig = (priority: StaffNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          border: 'border-red-200',
          pulse: true
        };
      case 'high':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-600',
          border: 'border-orange-200',
          pulse: false
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600',
          border: 'border-yellow-200',
          pulse: false
        };
      default:
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-600',
          border: 'border-blue-200',
          pulse: false
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mb-2" />
        <p className="text-sm">All caught up!</p>
        <p className="text-xs">No pending notifications</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 mt-4">
      <div className="space-y-2 pr-4">
        {notifications.map((notification) => {
          const config = getPriorityConfig(notification.priority);
          const isUnread = notification.status === 'pending';

          return (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-all ${
                isUnread 
                  ? `bg-background ${config.border} ${config.pulse ? 'animate-pulse' : ''}` 
                  : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-1.5 rounded-full ${config.bg} flex-shrink-0`}>
                  {getNotificationIcon(notification.notification_type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm leading-tight">
                      {notification.title}
                    </h4>
                    {notification.department && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {notification.department}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                    
                    {notification.status === 'escalated' && (
                      <Badge variant="destructive" className="text-xs">
                        Escalated
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  {isUnread && notification.actions.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {notification.actions.includes('acknowledge') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onAcknowledge(notification.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {notification.actions.includes('complete') && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onComplete(notification.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
