import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Phase 7.5: Network Status Indicator
 * Shows visual feedback during rehydration and network status changes
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRehydrating, setIsRehydrating] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsRehydrating(true);
      setTimeout(() => setIsRehydrating(false), 3000);
    };
    
    const handleOffline = () => setIsOnline(false);
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setIsRehydrating(true);
        setTimeout(() => setIsRehydrating(false), 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (isOnline && !isRehydrating) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm",
      isOnline ? "bg-blue-500/90 text-white" : "bg-red-500/90 text-white"
    )}>
      {isRehydrating ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Refreshing session...</span>
        </>
      ) : !isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">No internet connection</span>
        </>
      ) : null}
    </div>
  );
}
