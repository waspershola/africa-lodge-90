import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * @deprecated Phase 1: This hook is deprecated. Use useUnifiedRealtime() instead.
 * 
 * This hook will be removed in Phase 2 after all components have been migrated.
 * The debouncing logic has been incorporated into useUnifiedRealtime.
 */
export function useFrontDeskRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const invalidationTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Debounced invalidation to prevent rapid-fire updates and infinite loops
  const debouncedInvalidate = useCallback((queryKey: string[], delay: number = 300) => {
    const key = queryKey.join('-');
    
    if (invalidationTimeoutRef.current[key]) {
      clearTimeout(invalidationTimeoutRef.current[key]);
    }
    
    invalidationTimeoutRef.current[key] = setTimeout(() => {
      console.log(`[Realtime] Invalidating query:`, queryKey);
      queryClient.invalidateQueries({ queryKey });
      delete invalidationTimeoutRef.current[key];
    }, delay);
  }, [queryClient]);

  // Phase R.3: Helper to setup channel
  const setupChannel = useCallback(() => {
    if (!user || !tenant) return null;

    console.log('[Realtime] Setting up Front Desk subscriptions for tenant:', tenant.tenant_id);

    const channel = supabase
      .channel(`tenant-${tenant.tenant_id}-frontdesk`)
      
      // Subscribe to room changes - immediate status updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Room status changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['room-availability', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['room-types', tenant.tenant_id] });
        }
      )

      // Subscribe to reservation changes - immediate booking updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Reservation changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['guests', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['group-reservations', tenant.tenant_id] });
        }
      )

      // Subscribe to guest changes - immediate guest info updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Guest info changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['guests', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['guest-search', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['recent-guests', tenant.tenant_id] });
        }
      )

      // Phase 2: Subscribe to folio changes - critical for checkout flow
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folios',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Folio changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
        }
      )

      // Subscribe to folio charges - immediate charge updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folio_charges',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Folio charge changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] });
        }
      )

      // Subscribe to payment changes - debounced to prevent infinite loops
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Payment received:', payload);
          // Use debounced invalidation with longer delay for payments
          debouncedInvalidate(['payments', tenant.tenant_id], 500);
          debouncedInvalidate(['folios', tenant.tenant_id], 500);
          // Don't invalidate folio-balances here - let components fetch individually
          debouncedInvalidate(['billing', tenant.tenant_id], 500);
          debouncedInvalidate(['rooms', tenant.tenant_id], 500);
          debouncedInvalidate(['owner', 'overview'], 500);
        }
      )

      // Subscribe to housekeeping tasks - immediate task updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'housekeeping_tasks',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Housekeeping task changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
        }
      )

      // Subscribe to QR requests - immediate service request updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_requests',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] QR request changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['qr-requests', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['qr-orders', tenant.tenant_id] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Front Desk channel status:', status);
        
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error - will retry on next visibility change');
        }
      });
    
    return channel;
  }, [user, tenant, queryClient, debouncedInvalidate]);

  useEffect(() => {
    // Initial setup
    channelRef.current = setupChannel();
    
    // Phase R.3: Reconnect on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Realtime] Tab visible - checking Front Desk channel health');
        
        const currentChannel = channelRef.current;
        if (currentChannel) {
          const state = currentChannel.state;
          
          if (state !== 'joined') {
            console.warn('[Realtime] Front Desk channel disconnected - reconnecting');
            supabase.removeChannel(currentChannel);
            channelRef.current = setupChannel();
          } else {
            console.log('[Realtime] Front Desk channel still healthy');
          }
        } else {
          console.log('[Realtime] No Front Desk channel exists - creating one');
          channelRef.current = setupChannel();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('[Realtime] Cleaning up Front Desk subscriptions');
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear all pending invalidation timeouts
      Object.values(invalidationTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      invalidationTimeoutRef.current = {};
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupChannel]);
}
