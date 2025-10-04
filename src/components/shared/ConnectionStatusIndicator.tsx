import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function ConnectionStatusIndicator({ 
  className, 
  showLabel = true 
}: ConnectionStatusIndicatorProps) {
  const { isOnline, status, lastSyncAt } = useNetworkStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          label: 'Online',
          variant: 'default' as const,
          color: 'text-green-600 dark:text-green-400'
        };
      case 'offline':
        return {
          icon: WifiOff,
          label: 'Offline',
          variant: 'destructive' as const,
          color: 'text-red-600 dark:text-red-400'
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          label: 'Syncing',
          variant: 'secondary' as const,
          color: 'text-blue-600 dark:text-blue-400'
        };
      case 'error':
        return {
          icon: WifiOff,
          label: 'Error',
          variant: 'destructive' as const,
          color: 'text-orange-600 dark:text-orange-400'
        };
      default:
        return {
          icon: Wifi,
          label: 'Unknown',
          variant: 'outline' as const,
          color: 'text-muted-foreground'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSyncAt) return null;
    
    const now = new Date();
    const syncDate = new Date(lastSyncAt);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return syncDate.toLocaleDateString();
  };

  const lastSyncText = formatLastSync();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={statusConfig.variant}
        className="flex items-center gap-1.5 px-2 py-1"
      >
        <Icon 
          className={cn(
            "h-3 w-3",
            statusConfig.color,
            status === 'syncing' && "animate-spin"
          )} 
        />
        {showLabel && (
          <span className="text-xs font-medium">
            {statusConfig.label}
          </span>
        )}
      </Badge>
      
      {lastSyncText && isOnline && (
        <span className="text-xs text-muted-foreground">
          Synced {lastSyncText}
        </span>
      )}
    </div>
  );
}
