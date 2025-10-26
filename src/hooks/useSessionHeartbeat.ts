import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSessionHeartbeatOptions {
  enabled?: boolean;
  intervalMinutes?: number;
  onSessionExpired?: () => void;
}

export function useSessionHeartbeat(options: UseSessionHeartbeatOptions = {}) {
  const {
    enabled = true,
    intervalMinutes = 15, // Check every 15 minutes
    onSessionExpired
  } = options;

  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  const showSessionExpiredToast = () => {
    toast({
      title: "Session Expired",
      description: "Please login again to continue",
      variant: "destructive",
      duration: 10000,
    });
  };

  const checkAndRefreshSession = async () => {
    try {
      console.log('Session heartbeat: Checking session status...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('Session heartbeat: No session found');
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;

      console.log('Session heartbeat:', {
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        timeUntilExpiry: Math.floor(timeUntilExpiry / 60) + ' minutes',
        retryCount: retryCountRef.current
      });

      // If session expires in less than 20 minutes, try to refresh
      if (timeUntilExpiry < 1200) { // 20 minutes
        console.log('Session heartbeat: Session expiring soon, attempting refresh...');
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session heartbeat: Refresh failed:', error.message);
          retryCountRef.current++;
          
          if (retryCountRef.current >= maxRetries) {
            console.log('Session heartbeat: Max retries reached, session considered expired');
            showSessionExpiredToast();
            
            // Clear interval and call expiration handler
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            onSessionExpired?.();
            return;
          } else {
            console.log(`Session heartbeat: Will retry (${retryCountRef.current}/${maxRetries})`);
          }
        } else {
          console.log('Session heartbeat: Session refreshed successfully');
          retryCountRef.current = 0; // Reset retry count on success
        }
      } else {
        // Reset retry count if session is healthy
        retryCountRef.current = 0;
      }
    } catch (error) {
      console.error('Session heartbeat: Unexpected error:', error);
      retryCountRef.current++;
      
      if (retryCountRef.current >= maxRetries) {
        console.log('Session heartbeat: Max retries reached due to errors');
        showSessionExpiredToast();
        onSessionExpired?.();
      }
    }
  };

  useEffect(() => {
    if (!enabled) return;

    console.log('Session heartbeat: Starting with interval of', intervalMinutes, 'minutes');
    
    // Start the interval
    intervalRef.current = setInterval(
      checkAndRefreshSession,
      intervalMinutes * 60 * 1000
    );

    // Check immediately on mount
    checkAndRefreshSession();

    return () => {
      if (intervalRef.current) {
        console.log('Session heartbeat: Cleaning up interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMinutes]);

  return {
    checkSession: checkAndRefreshSession
  };
}