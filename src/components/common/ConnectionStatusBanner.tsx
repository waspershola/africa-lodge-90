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
      console.log(`[ConnectionBanner] 🌐 HTTP health: ${healthy ? 'healthy' : 'unhealthy'}`);
      
      // ✅ F.5: Update ref FIRST, then check visibility inline
      isOnlineRef.current = healthy;
      setIsOnline(healthy);
      if (healthy) {
        setReconnecting(false);
      }
      
      // ✅ Inline visibility check to avoid stale refs
      const shouldShow = !isOnlineRef.current || !realtimeHealthyRef.current;
      setShowBanner(shouldShow);
      
      // Auto-dismiss logic with proper timer cleanup
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
        autoDismissTimer.current = null;
      }
      
      if (!shouldShow) {
        autoDismissTimer.current = setTimeout(() => {
          setShowBanner(false);
          autoDismissTimer.current = null;
        }, 3000);
      }
    });
    
    // Monitor realtime channel health
    const unsubscribeRealtime = realtimeChannelManager.onStatusChange((status) => {
      if (!mounted) return;
      console.log(`[ConnectionBanner] 📡 Realtime status: ${status}`);
      
      const healthy = status === 'connected';
      
      // ✅ F.5: Update ref FIRST, then check visibility inline
      realtimeHealthyRef.current = healthy;
      setRealtimeHealthy(healthy);
      
      // ✅ Inline visibility check to avoid stale refs
      const shouldShow = !isOnlineRef.current || !realtimeHealthyRef.current;
      setShowBanner(shouldShow);
      
      // Auto-dismiss logic with proper timer cleanup
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
        autoDismissTimer.current = null;
      }
      
      if (!shouldShow) {
        autoDismissTimer.current = setTimeout(() => {
          setShowBanner(false);
          autoDismissTimer.current = null;
        }, 3000);
      }
    });
    
    return () => {
      mounted = false;
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
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
