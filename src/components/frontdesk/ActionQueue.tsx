import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useActionQueue, type QueuedAction } from "@/hooks/useActionQueue";

// QueuedAction interface is now imported from useActionQueue hook

interface ActionQueueProps {
  isVisible: boolean;
  isOnline: boolean;
}

export const ActionQueue = ({ isVisible, isOnline }: ActionQueueProps) => {
  const { 
    queuedActions, 
    isRetrying, 
    retryAction, 
    retryAll, 
    removeAction, 
    clearCompleted 
  } = useActionQueue();

  // Auto-retry when online
  useEffect(() => {
    if (isOnline && queuedActions.some(action => action.status === 'pending' || action.status === 'failed')) {
      retryAll();
    }
  }, [isOnline, queuedActions, retryAll]);

  const getStatusConfig = (status: QueuedAction['status']) => {
    switch (status) {
      case 'pending':
        return { color: 'text-warning-foreground', bg: 'bg-warning/10', icon: Clock };
      case 'processing':
        return { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: RefreshCw };
      case 'failed':
        return { color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle };
      case 'completed':
        return { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle };
      default:
        return { color: 'text-muted-foreground', bg: 'bg-muted/10', icon: AlertCircle };
    }
  };

  // Action handlers are now managed by the useActionQueue hook

  const pendingCount = queuedActions.filter(action => action.status === 'pending').length;
  const failedCount = queuedActions.filter(action => action.status === 'failed').length;
  const completedCount = queuedActions.filter(action => action.status === 'completed').length;

  if (!isVisible || queuedActions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-4"
    >
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              Action Queue
              <Badge variant="outline" className="ml-2">
                {queuedActions.length} items
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {isOnline && (pendingCount > 0 || failedCount > 0) && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isRetrying}
                  onClick={retryAll}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  Retry All
                </Button>
              )}
              
              {completedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearCompleted}
                >
                  Clear Completed
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-warning" />
              Pending: {pendingCount}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              Failed: {failedCount}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-success" />
              Completed: {completedCount}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <AnimatePresence>
            {queuedActions.map((action, index) => {
              const config = getStatusConfig(action.status);
              const StatusIcon = config.icon;
              
              return (
                <motion.div
                  key={action.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`p-3 rounded-lg border ${config.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-0.5 ${config.color}`}>
                          <StatusIcon className={`h-4 w-4 ${action.status === 'processing' ? 'animate-spin' : ''}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Room {action.roomNumber}</span>
                            {action.guest && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm">{action.guest}</span>
                              </>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>
                              {action.timestamp.toLocaleDateString()} {action.timestamp.toLocaleTimeString()}
                            </span>
                            {action.status === 'failed' && (
                              <span>
                                Retries: {action.retryCount}/{action.maxRetries}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {action.status === 'failed' && action.retryCount < action.maxRetries && isOnline && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => retryAction(action.id)}
                            disabled={isRetrying}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAction(action.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {index < queuedActions.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};