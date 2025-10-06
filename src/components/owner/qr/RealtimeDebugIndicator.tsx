import { Activity, AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RealtimeDebugIndicatorProps {
  isConnected: boolean;
  reconnectAttempts: number;
  lastSync?: Date;
  isOnline?: boolean;
}

/**
 * Phase 2D: Visual Debug Indicator for Realtime Status
 * Shows connection health, sync status, and network state
 */
export function RealtimeDebugIndicator({
  isConnected,
  reconnectAttempts,
  lastSync,
  isOnline = true
}: RealtimeDebugIndicatorProps) {
  // Only show in development mode
  if (!import.meta.env.DEV) return null;

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-destructive" />;
    if (!isConnected) return <AlertCircle className="h-4 w-4 text-warning" />;
    if (reconnectAttempts > 0) return <Activity className="h-4 w-4 text-warning animate-pulse" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!isConnected) return 'Disconnected';
    if (reconnectAttempts > 0) return 'Reconnecting...';
    return 'Connected';
  };

  const getStatusVariant = (): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (!isOnline || !isConnected) return 'destructive';
    if (reconnectAttempts > 0) return 'outline';
    return 'default';
  };

  return (
    <Card className="fixed bottom-4 right-4 p-4 shadow-lg border z-50 bg-card/95 backdrop-blur">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-semibold text-sm">Realtime Sync</h3>
        </div>
        
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStatusVariant()} className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
          
          {reconnectAttempts > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Attempts:</span>
              <span className="font-mono">{reconnectAttempts}</span>
            </div>
          )}
          
          {lastSync && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Last Sync:</span>
              <span className="font-mono text-xs">
                {lastSync.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Network:</span>
            <span className={isOnline ? 'text-success' : 'text-destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
