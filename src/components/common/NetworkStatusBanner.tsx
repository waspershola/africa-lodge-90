import { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Phase 2: Network Status Banner
 * 
 * Visual indicator showing:
 * - 🟢 Online: Connected and synced
 * - 🔴 Offline: Working locally
 * - 🔄 Syncing: Synchronizing data
 * - ⚠️ Error: Connection issues
 */

interface NetworkStatusBannerProps {
  /** Show banner in compact mode (default: false) */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export function NetworkStatusBanner({ compact = false, className }: NetworkStatusBannerProps) {
  const { status, isOnline, lastSyncAt, errorMessage } = useNetworkStatus();

  // Don't show banner when online and no errors
  if (status === 'online' && !errorMessage) {
    return null;
  }

  const getBannerConfig = () => {
    switch (status) {
      case 'offline':
        return {
          icon: WifiOff,
          bgColor: 'bg-destructive/10',
          textColor: 'text-destructive',
          borderColor: 'border-destructive/20',
          title: 'Offline',
          message: 'Working locally - changes will sync when online',
          iconClassName: 'text-destructive'
        };
      
      case 'syncing':
        return {
          icon: RefreshCw,
          bgColor: 'bg-primary/10',
          textColor: 'text-primary',
          borderColor: 'border-primary/20',
          title: 'Syncing',
          message: 'Synchronizing data...',
          iconClassName: 'text-primary animate-spin'
        };
      
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-orange-500/10',
          textColor: 'text-orange-600 dark:text-orange-400',
          borderColor: 'border-orange-500/20',
          title: 'Connection Issue',
          message: errorMessage || 'Retrying connection...',
          iconClassName: 'text-orange-600 dark:text-orange-400'
        };
      
      default:
        return {
          icon: Wifi,
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-600 dark:text-green-400',
          borderColor: 'border-green-500/20',
          title: 'Online',
          message: lastSyncAt 
            ? `Last synced ${formatDistanceToNow(lastSyncAt, { addSuffix: true })}`
            : 'Connected',
          iconClassName: 'text-green-600 dark:text-green-400'
        };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm',
          config.bgColor,
          config.textColor,
          config.borderColor,
          className
        )}
      >
        <Icon className={cn('h-4 w-4', config.iconClassName)} />
        <span className="font-medium">{config.title}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        config.bgColor,
        config.borderColor,
        'animate-in slide-in-from-top-2 duration-300',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClassName)} />
      
      <div className="flex-1 space-y-1">
        <p className={cn('text-sm font-medium', config.textColor)}>
          {config.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {config.message}
        </p>
      </div>

      {status === 'offline' && (
        <div className={cn('text-xs font-mono', config.textColor)}>
          Local Mode
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant for header/toolbar
 */
export function NetworkStatusIndicator({ className }: { className?: string }) {
  return <NetworkStatusBanner compact className={className} />;
}
