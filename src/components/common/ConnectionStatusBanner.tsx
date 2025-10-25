import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseHealthMonitor } from '@/lib/supabase-health-monitor';
import { realtimeChannelManager } from '@/lib/realtime-channel-manager';
import { queryClient } from '@/lib/queryClient';

export const ConnectionStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [realtimeHealthy, setRealtimeHealthy] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  
  useEffect(() => {
    // Monitor HTTP connection health
    const unsubscribeHealth = supabaseHealthMonitor.onHealthChange((healthy) => {
      setIsOnline(healthy);
      if (healthy) {
        setReconnecting(false);
      }
    });
    
    // Monitor realtime channel health
    const unsubscribeRealtime = realtimeChannelManager.onStatusChange((status) => {
      setRealtimeHealthy(status === 'connected');
    });
    
    return () => {
      unsubscribeHealth();
      unsubscribeRealtime();
    };
  }, []);
  
  const handleRetry = async () => {
    setReconnecting(true);
    
    // Check HTTP health
    await supabaseHealthMonitor.checkHealth();
    
    // Reconnect realtime channels
    await realtimeChannelManager.reconnectAll();
    
    // Refetch active queries
    queryClient.refetchQueries({ type: 'active' });
    
    setReconnecting(false);
  };
  
  // Show banner if EITHER connection is unhealthy
  const showBanner = !isOnline || !realtimeHealthy;
  
  if (!showBanner) return null;
  
  // Determine message based on what's down
  const message = !isOnline 
    ? "Connection lost. Some features may not work until reconnected."
    : "Live updates paused. Reconnecting...";
  
  return (
    <Alert 
      variant={!isOnline ? "destructive" : "default"} 
      className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0"
    >
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          disabled={reconnecting}
          className="ml-4"
        >
          {reconnecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Reconnecting...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Retry Connection
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
