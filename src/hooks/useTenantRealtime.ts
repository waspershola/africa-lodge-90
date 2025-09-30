import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

/**
 * Centralized real-time subscription hook for tenant-scoped updates
 * Manages all database changes for rooms, reservations, folios, payments, etc.
 */
export function useTenantRealtime() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();

  useEffect(() => {
    if (!user || !tenant?.tenant_id) return;

    console.log('[Realtime] Setting up centralized tenant subscriptions:', tenant.tenant_id);

    // Single tenant-scoped channel for all updates
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
      .subscribe();

    return () => {
      console.log('[Realtime] Cleaning up tenant subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user, tenant?.tenant_id, queryClient]);
}
