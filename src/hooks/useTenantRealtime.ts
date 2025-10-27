import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * @deprecated Phase 1: This hook is deprecated. Use useUnifiedRealtime() instead.
 * 
 * This hook will be removed in Phase 2 after all components have been migrated.
 * The new unified hook provides better performance and conflict resolution.
 */
export function useTenantRealtime() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Phase R.3: Helper to setup channel
  const setupChannel = useCallback(() => {
    if (!user || !tenant?.tenant_id) return null;
    
    console.log('[Realtime] Setting up channel:', tenant.tenant_id);
    
    const channel = supabase
      .channel(`tenant-${tenant.tenant_id}-realtime`)
      
      // Rooms table - status changes, assignments
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Room update:', payload.eventType, payload.new);
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['room-availability', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['overstays', tenant.tenant_id] });
        }
      )
      
      // Reservations table - check-ins, check-outs, new bookings
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Reservation update:', payload.eventType, payload.new);
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['overstays', tenant.tenant_id] });
        }
      )
      
      // Folios table - billing updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folios',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Folio update:', payload.eventType, payload.new);
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] });
        }
      )
      
      // Folio charges - service charges, room charges
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folio_charges',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Folio charge update:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] });
        }
      )
      
      // Payments table - payment processing
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Payment update:', payload.eventType, payload.new);
          queryClient.invalidateQueries({ queryKey: ['payments', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
        }
      )
      
      // Guests table - guest profile updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Guest update:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['guests', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['guest-search', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['recent-guests', tenant.tenant_id] });
        }
      )
      
      // Housekeeping tasks - cleaning status updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'housekeeping_tasks',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] Housekeeping task update:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
        }
      )
      
      // QR requests - guest service requests
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_requests',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[Realtime Event] QR request update:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['qr-requests', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['qr-orders', tenant.tenant_id] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Channel status:', status);
        
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error - will retry on next visibility change');
        }
      });
    
    return channel;
  }, [user, tenant?.tenant_id, queryClient]);

  useEffect(() => {
    // Initial setup
    channelRef.current = setupChannel();
    
    // Phase R.3: Reconnect on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Realtime] Tab visible - checking channel health');
        
        const currentChannel = channelRef.current;
        if (currentChannel) {
          const state = currentChannel.state;
          
          if (state !== 'joined') {
            console.warn('[Realtime] Channel disconnected - reconnecting');
            supabase.removeChannel(currentChannel);
            channelRef.current = setupChannel();
          } else {
            console.log('[Realtime] Channel still healthy');
          }
        } else {
          console.log('[Realtime] No channel exists - creating one');
          channelRef.current = setupChannel();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) {
        console.log('[Realtime] Cleaning up tenant subscriptions');
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupChannel]);
}
