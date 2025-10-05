import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { formatDistanceToNow } from 'date-fns';

export function NetworkStatusIndicator() {
  const { status, isOnline, lastSyncAt, errorMessage } = useNetworkStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: <Wifi className="h-3 w-3" />,
          label: 'Online',
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-600 border-green-200'
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Offline',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-600 border-red-200'
        };
      case 'syncing':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          label: 'Syncing',
          variant: 'secondary' as const,
          className: 'bg-blue-500/10 text-blue-600 border-blue-200'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'Error',
          variant: 'destructive' as const,
          className: 'bg-orange-500/10 text-orange-600 border-orange-200'
        };
    }
  };

  const config = getStatusConfig();

  const getTooltipContent = () => {
    if (status === 'offline') {
      return 'You are currently offline. Changes will sync when connection is restored.';
    }
    if (status === 'error') {
      return errorMessage || 'Connection error occurred';
    }
    if (lastSyncAt) {
      return `Last synced ${formatDistanceToNow(lastSyncAt, { addSuffix: true })}`;
    }
    return 'Connected to server';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={`flex items-center gap-1.5 text-xs ${config.className}`}
          >
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
