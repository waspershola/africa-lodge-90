import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, RefreshCw, Trash2, Clock, CheckCircle, 
  XCircle, AlertCircle, Bed, Users, CreditCard 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'retrying' | 'failed';
  retryCount?: number;
}

interface ActionQueueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queuedActions: QueuedAction[];
  onRetry: () => void;
  onClear: () => void;
  isOffline: boolean;
}

const actionIcons = {
  assign_room: Bed,
  check_in: Users,
  check_out: Users,
  collect_payment: CreditCard,
  new_reservation: Clock,
  contact_guest: Users,
  open_folio: Users,
  create_work_order: AlertCircle,
  open_power_panel: AlertCircle,
};

const actionLabels = {
  assign_room: 'Assign Room',
  check_in: 'Check-In Guest',
  check_out: 'Check-Out Guest',
  collect_payment: 'Collect Payment',
  new_reservation: 'New Reservation',
  contact_guest: 'Contact Guest',
  open_folio: 'Open Folio',
  create_work_order: 'Create Work Order',
  open_power_panel: 'Open Power Panel',
};

export default function ActionQueue({
  open,
  onOpenChange,
  queuedActions,
  onRetry,
  onClear,
  isOffline
}: ActionQueueProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'retrying': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'retrying': return RefreshCw;
      case 'failed': return XCircle;
      default: return Clock;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Action Queue
            <Badge variant="secondary">{queuedActions.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Queue Controls */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Offline</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">Online</span>
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {queuedActions.length} actions queued
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isOffline && queuedActions.length > 0 && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry All
                </Button>
              )}
              {queuedActions.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onClear}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Queue List */}
          <ScrollArea className="h-[400px]">
            <AnimatePresence mode="popLayout">
              {queuedActions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                  <h3 className="font-medium mb-2">No queued actions</h3>
                  <p className="text-sm text-muted-foreground">
                    All actions are processed or the queue is empty
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {queuedActions.map((action, index) => {
                    const Icon = actionIcons[action.type as keyof typeof actionIcons] || AlertCircle;
                    const StatusIcon = getStatusIcon(action.status);
                    
                    return (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="modern-card">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    {actionLabels[action.type as keyof typeof actionLabels] || action.type}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTimestamp(action.timestamp)}
                                    {action.retryCount && action.retryCount > 0 && (
                                      <span className="ml-2">• Retry {action.retryCount}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusColor(action.status) as any}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {action.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Action Data Preview */}
                            {action.data && Object.keys(action.data).length > 1 && (
                              <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                                <pre className="text-muted-foreground">
                                  {JSON.stringify(action.data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Queue Info */}
          {queuedActions.length > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Actions will automatically retry when connection is restored. 
                  Queue persists across page reloads.
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}