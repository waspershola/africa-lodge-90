import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [showBanner, setShowBanner] = useState(false);
  
  // Use refs to track connection state without causing re-renders
  const isOnlineRef = useRef(true);
  const realtimeHealthyRef = useRef(true);
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Update banner visibility based on connection states
  const updateBannerVisibility = useCallback(() => {
    const shouldShow = !isOnlineRef.current || !realtimeHealthyRef.current;
    setShowBanner(shouldShow);
    
    // Auto-dismiss banner 3 seconds after both connections are healthy
    if (!shouldShow && autoDismissTimer.current === null) {
      autoDismissTimer.current = setTimeout(() => {
        setShowBanner(false);
        autoDismissTimer.current = null;
      }, 3000);
    } else if (shouldShow && autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
  }, []);
  
  useEffect(() => {
    let mounted = true;
    
    // Add grace period to allow channels to register before showing banner
    Promise.all([
      supabaseHealthMonitor.checkHealth(),
      new Promise(resolve => setTimeout(resolve, 500))
    ]).then(([isHealthy]) => {
      if (!mounted) return;
      if (!isHealthy) {
        setIsOnline(false);
        isOnlineRef.current = false;
        setShowBanner(true);
      }
    });
    
    // Monitor HTTP connection health
    const unsubscribeHealth = supabaseHealthMonitor.onHealthChange((healthy) => {
      if (!mounted) return;
      isOnlineRef.current = healthy;
      setIsOnline(healthy);
      if (healthy) {
        setReconnecting(false);
      }
      updateBannerVisibility();
    });
    
    // Monitor realtime channel health
    const unsubscribeRealtime = realtimeChannelManager.onStatusChange((status) => {
      if (!mounted) return;
      const healthy = status === 'connected';
      realtimeHealthyRef.current = healthy;
      setRealtimeHealthy(healthy);
      updateBannerVisibility();
    });
    
    return () => {
      mounted = false;
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
      unsubscribeHealth();
      unsubscribeRealtime();
    };
  }, [updateBannerVisibility]);
  
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
