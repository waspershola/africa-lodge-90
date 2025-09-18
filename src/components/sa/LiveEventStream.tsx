import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  User, 
  Building2, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface LiveEvent {
  id: string;
  type: 'user_login' | 'payment_processed' | 'booking_created' | 'system_alert' | 'plan_upgrade';
  message: string;
  tenantName?: string;
  userName?: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

const eventIcons = {
  user_login: User,
  payment_processed: CreditCard,
  booking_created: Building2,
  system_alert: AlertTriangle,
  plan_upgrade: Zap
};

const severityColors = {
  info: 'text-blue-500 bg-blue-50',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  error: 'text-danger bg-danger/10'
};

const badgeVariants = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-danger/10 text-danger border-danger/20'
};

// Mock live events - in real app this would come from WebSocket/SSE
const mockEvents: LiveEvent[] = [
  {
    id: '1',
    type: 'user_login',
    message: 'User logged in successfully',
    tenantName: 'Grand Plaza Hotel',
    userName: 'john.doe@hotel.com',
    timestamp: new Date(Date.now() - 2000).toISOString(),
    severity: 'info'
  },
  {
    id: '2',
    type: 'payment_processed',
    message: 'Payment of ₦85,000 processed successfully',
    tenantName: 'Royal Suite Inn',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    severity: 'success'
  },
  {
    id: '3',
    type: 'booking_created',
    message: 'New reservation created for 3 nights',
    tenantName: 'Ocean View Resort',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    severity: 'info'
  },
  {
    id: '4',
    type: 'system_alert',
    message: 'High CPU usage detected on server-03',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    severity: 'warning'
  },
  {
    id: '5',
    type: 'plan_upgrade',
    message: 'Upgraded to Pro plan',
    tenantName: 'City Center Hotel',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    severity: 'success'
  }
];

export default function LiveEventStream() {
  const [events, setEvents] = useState<LiveEvent[]>(mockEvents);
  const [isConnected, setIsConnected] = useState(true);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newEventTypes: LiveEvent['type'][] = ['user_login', 'payment_processed', 'booking_created'];
      const randomType = newEventTypes[Math.floor(Math.random() * newEventTypes.length)];
      
      const newEvent: LiveEvent = {
        id: Date.now().toString(),
        type: randomType,
        message: `New ${randomType.replace('_', ' ')} event`,
        tenantName: 'Sample Hotel',
        timestamp: new Date().toISOString(),
        severity: 'info'
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Keep last 20 events
    }, 15000); // New event every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="modern-card h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Live Event Stream
          <div className="flex items-center gap-2 ml-auto">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80 px-6">
          <AnimatePresence initial={false}>
            {events.map((event, index) => {
              const Icon = eventIcons[event.type];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index === 0 ? 0.1 : 0
                  }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <div className={`p-2 rounded-full ${severityColors[event.severity]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={badgeVariants[event.severity]}>
                        {event.type.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {event.message}
                    </p>
                    {(event.tenantName || event.userName) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {event.tenantName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {event.tenantName}
                          </span>
                        )}
                        {event.userName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.userName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}