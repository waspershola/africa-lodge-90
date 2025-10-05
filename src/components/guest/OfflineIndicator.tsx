import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineIndicator() {
  const { syncStatus, syncNow } = useOfflineSync();

  if (syncStatus.isOnline && syncStatus.pendingCount === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 p-4 shadow-lg border-2 z-50 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        {!syncStatus.isOnline ? (
          <WifiOff className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
        ) : syncStatus.isSyncing ? (
          <RefreshCw className="w-5 h-5 text-primary animate-spin mt-0.5 flex-shrink-0" />
        ) : syncStatus.pendingCount > 0 ? (
          <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {!syncStatus.isOnline && 'You are offline'}
            {syncStatus.isOnline && syncStatus.isSyncing && 'Syncing requests...'}
            {syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingCount > 0 && 
              `${syncStatus.pendingCount} request${syncStatus.pendingCount > 1 ? 's' : ''} pending`}
          </p>
          
          <p className="text-xs text-muted-foreground mt-1">
            {!syncStatus.isOnline && 'Requests will be saved and sent when connection is restored'}
            {syncStatus.isOnline && syncStatus.isSyncing && 'Sending queued requests to server'}
            {syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingCount > 0 && 
              'Tap retry to send now'}
          </p>

          {syncStatus.lastError && (
            <p className="text-xs text-destructive mt-1">{syncStatus.lastError}</p>
          )}

          {syncStatus.lastSyncAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Last synced: {syncStatus.lastSyncAt.toLocaleTimeString()}
            </p>
          )}
        </div>

        {syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={syncNow}
            className="flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
