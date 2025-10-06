import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  CreditCard, 
  Users, 
  Settings,
  Pause,
  Play,
  Filter
} from 'lucide-react';

interface AuditEvent {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  tenant_id: string;
  actor_email?: string;
  actor_role?: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  ip_address?: string;
}

const CRITICAL_ACTIONS = [
  'PAYMENT_FAILED',
  'UNAUTHORIZED_ACCESS',
  'SECURITY_VIOLATION',
  'DATA_BREACH',
  'SYSTEM_ERROR'
];

const ACTION_CATEGORIES = {
  AUTH: ['LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'USER_CREATED'],
  PAYMENT: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SUBSCRIPTION_UPDATED'],
  SECURITY: ['UNAUTHORIZED_ACCESS', 'SECURITY_VIOLATION', 'DATA_BREACH'],
  SYSTEM: ['SYSTEM_ERROR', 'BACKUP_CREATED', 'MAINTENANCE_START'],
  USER: ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'ROLE_CHANGED']
};

export default function RealtimeAuditStream() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical'>('all');
  const [maxEvents] = useState(100);

  // For now, using mock real-time events since useRealtimeAudit is not implemented
  // useRealtimeUpdates(); // Would be implemented for audit events
  
  // Mock real-time simulation for demo purposes
  useEffect(() => {
    if (!isStreaming) return;
    
    const mockEvents: AuditEvent[] = [
      {
        id: Date.now().toString(),
        action: 'USER_LOGIN',
        resource_type: 'auth',
        resource_id: 'user-123',
        actor_email: 'demo@hotel.com',
        tenant_id: 'demo-tenant',
        description: 'User logged in successfully',
        metadata: { ip_address: '192.168.1.1' },
        created_at: new Date().toISOString()
      }
    ];
    
    // Simulate periodic events
    const interval = setInterval(() => {
      if (events.length < maxEvents) {
        const newEvent = {
          ...mockEvents[0],
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        };
        setEvents(prev => [newEvent, ...prev].slice(0, maxEvents));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isStreaming, events.length, maxEvents]);

  const filteredEvents = events.filter(event => 
    filter === 'all' || CRITICAL_ACTIONS.includes(event.action)
  );

  const getActionIcon = (action: string) => {
    if (ACTION_CATEGORIES.AUTH.includes(action)) return <Users className="h-4 w-4" />;
    if (ACTION_CATEGORIES.PAYMENT.includes(action)) return <CreditCard className="h-4 w-4" />;
    if (ACTION_CATEGORIES.SECURITY.includes(action)) return <Shield className="h-4 w-4" />;
    if (ACTION_CATEGORIES.SYSTEM.includes(action)) return <Settings className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (CRITICAL_ACTIONS.includes(action)) return 'destructive';
    if (ACTION_CATEGORIES.PAYMENT.includes(action)) return 'secondary';
    if (ACTION_CATEGORIES.SECURITY.includes(action)) return 'outline';
    return 'default';
  };

  const getSeverityColor = (action: string) => {
    if (CRITICAL_ACTIONS.includes(action)) return 'text-red-600 dark:text-red-400';
    if (ACTION_CATEGORIES.SECURITY.includes(action)) return 'text-orange-600 dark:text-orange-400';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Audit Stream
            </CardTitle>
            <CardDescription>
              Real-time system events and security monitoring
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as 'all' | 'critical')}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Events</option>
                <option value="critical">Critical Only</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              {isStreaming ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <Switch 
                checked={isStreaming}
                onCheckedChange={setIsStreaming}
              />
              <span className="text-sm">Live</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2" />
              <p>{isStreaming ? 'Waiting for events...' : 'Streaming paused'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    CRITICAL_ACTIONS.includes(event.action)
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded ${getSeverityColor(event.action)}`}>
                      {getActionIcon(event.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionColor(event.action)} className="text-xs">
                            {event.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.resource_type}
                          </span>
                        </div>
                        
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at))} ago
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium mb-1">
                        {event.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {event.actor_email && (
                          <span>By: {event.actor_email}</span>
                        )}
                        {event.actor_role && (
                          <span>Role: {event.actor_role}</span>
                        )}
                        {event.ip_address && (
                          <span>IP: {event.ip_address}</span>
                        )}
                      </div>
                      
                      {Object.keys(event.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                            Metadata
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    
                    {CRITICAL_ACTIONS.includes(event.action) && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span>Showing {filteredEvents.length} of {events.length} events</span>
          <span>Buffer: {maxEvents} events max</span>
        </div>
      </CardContent>
    </Card>
  );
}