// @ts-nocheck
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionMonitorProps {
  user: any;
  logout: () => Promise<void>;
}

/**
 * Hook to monitor if the current session has been revoked by admin
 * and automatically log out the user if detected
 */
export function useSessionMonitor({ user, logout }: SessionMonitorProps) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Get current session ID
    const getCurrentSession = async () => {
      const { data } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        currentSessionIdRef.current = data.id;
      }
    };

    getCurrentSession();

    // Check if session is still active every 2 minutes
    checkIntervalRef.current = setInterval(async () => {
      if (!currentSessionIdRef.current) return;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('is_active, revoked_at, revocation_reason')
        .eq('id', currentSessionIdRef.current)
        .single();

      if (error || !data || !data.is_active) {
        // Session has been revoked
        toast.error(
          data?.revocation_reason || 'Your session has been terminated by an administrator',
          { duration: 10000 }
        );
        
        // Clear interval and logout
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        
        await logout();
      }
    }, 2 * 60 * 1000); // Check every 2 minutes

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user?.id, logout]);
}
