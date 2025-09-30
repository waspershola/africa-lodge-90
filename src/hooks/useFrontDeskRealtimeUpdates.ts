import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export function useFrontDeskRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();

  useEffect(() => {
    if (!user || !tenant) return;

    console.log('[Realtime] Setting up Front Desk subscriptions for tenant:', tenant.tenant_id);

    // Phase 2: Tenant-scoped channel for better performance
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

      // Subscribe to payment changes - immediate payment updates
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
          queryClient.invalidateQueries({ queryKey: ['payments', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] });
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
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
      .subscribe();

    return () => {
      console.log('[Realtime] Cleaning up Front Desk subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user, tenant, queryClient]);
}
