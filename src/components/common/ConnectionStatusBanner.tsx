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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Use refs to track connection state without causing re-renders
  const isOnlineRef = useRef(true);
  const realtimeHealthyRef = useRef(true);
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);
  const disconnectedSince = useRef<number | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    // Phase F.7: Extended grace period (5s) to prevent false alarms
    Promise.all([
      supabaseHealthMonitor.checkHealth(),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]).then(([isHealthy]) => {
      if (!mounted) return;
      // Only show banner if connection is genuinely unhealthy after grace period
      if (!isHealthy) {
        console.warn('[ConnectionBanner] Initial health check failed after 5s grace period');
        setIsOnline(false);
        isOnlineRef.current = false;
        disconnectedSince.current = Date.now();
        setShowBanner(true);
      } else {
        console.log('[ConnectionBanner] Initial health check passed');
      }
    }).catch((error) => {
      console.error('[ConnectionBanner] Initial health check error:', error);
      if (mounted) {
        disconnectedSince.current = Date.now();
        setShowBanner(true);
      }
    });
    
    // Monitor HTTP connection health
    const unsubscribeHealth = supabaseHealthMonitor.onHealthChange((healthy) => {
      if (!mounted) return;
      console.log(`[ConnectionBanner] 🌐 HTTP health: ${healthy ? 'healthy' : 'unhealthy'}`);
      
      // Update refs and state
      isOnlineRef.current = healthy;
      setIsOnline(healthy);
      
      if (healthy) {
        setReconnecting(false);
        setReconnectAttempts(0);
        disconnectedSince.current = null;
      } else {
        if (!disconnectedSince.current) {
          disconnectedSince.current = Date.now();
        }
      }
      
      // F.7: Only show banner if disconnected for >5 seconds
      const timeSinceDisconnect = disconnectedSince.current 
        ? Date.now() - disconnectedSince.current 
        : 0;
      
      const shouldShow = (!isOnlineRef.current || !realtimeHealthyRef.current) && timeSinceDisconnect > 5000;
      setShowBanner(shouldShow);
      
      // F.7: Auto-dismiss with 5s delay + fade-out
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
        autoDismissTimer.current = null;
      }
      
      if (!shouldShow && healthy) {
        autoDismissTimer.current = setTimeout(() => {
          setShowBanner(false);
          autoDismissTimer.current = null;
        }, 5000);
      }
    });
    
    // Monitor realtime channel health
    const unsubscribeRealtime = realtimeChannelManager.onStatusChange((status) => {
      if (!mounted) return;
      console.log(`[ConnectionBanner] 📡 Realtime status: ${status}`);
      
      const healthy = status === 'connected';
      
      // Update refs and state
      realtimeHealthyRef.current = healthy;
      setRealtimeHealthy(healthy);
      
      if (!healthy && !disconnectedSince.current) {
        disconnectedSince.current = Date.now();
      } else if (healthy) {
        disconnectedSince.current = null;
      }
      
      // F.7: Only show banner if disconnected for >5 seconds
      const timeSinceDisconnect = disconnectedSince.current 
        ? Date.now() - disconnectedSince.current 
        : 0;
      
      const shouldShow = (!isOnlineRef.current || !realtimeHealthyRef.current) && timeSinceDisconnect > 5000;
      setShowBanner(shouldShow);
      
      // F.7: Auto-dismiss with 5s delay
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
        autoDismissTimer.current = null;
      }
      
      if (!shouldShow && healthy) {
        autoDismissTimer.current = setTimeout(() => {
          setShowBanner(false);
          autoDismissTimer.current = null;
        }, 5000);
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
    setReconnectAttempts(prev => prev + 1);
    
    try {
      // Check HTTP health
      await supabaseHealthMonitor.checkHealth();
      
      // Reconnect realtime channels
      await realtimeChannelManager.reconnectAll();
      
      // F.6: Invalidate and refetch critical queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return ['guests', 'rooms', 'reservations', 'qrRequests'].includes(key);
        }
      });
      
      // Refetch active queries
      await queryClient.refetchQueries({ type: 'active', stale: true });
      
      console.log('[ConnectionBanner] Reconnection complete, queries refreshed');
    } catch (error) {
      console.error('[ConnectionBanner] Reconnection failed:', error);
    } finally {
      setReconnecting(false);
    }
  };
  
  if (!showBanner) return null;
  
  // F.7: Enhanced message with reconnection progress
  const getStatusMessage = () => {
    if (reconnecting && reconnectAttempts > 0) {
      return `Reconnecting (attempt ${reconnectAttempts}/10)...`;
    }
    if (!isOnline) {
      return "Connection lost. Some features may not work until reconnected.";
    }
    return "Live updates paused. Reconnecting...";
  };
  
  const message = getStatusMessage();
  
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
