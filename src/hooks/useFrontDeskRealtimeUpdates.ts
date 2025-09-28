import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export function useFrontDeskRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();

  useEffect(() => {
    if (!user || !tenant) return;

    console.log('Setting up Front Desk realtime subscriptions for tenant:', tenant.tenant_id);

    // Subscribe to room changes - immediate status updates
    const roomsChannel = supabase
      .channel('frontdesk-rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('Room status changed, updating front desk data:', payload);
          
          // Special handling for automatic room status updates from cancellations
          if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
            console.log(`Room ${payload.new?.room_number} status changed from ${payload.old?.status} to ${payload.new?.status}`);
            
            // Invalidate all room-related queries with aggressive refresh
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['room-availability'] });
            queryClient.invalidateQueries({ queryKey: ['room-types'] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
            
            // Force refetch to ensure immediate UI update
            queryClient.refetchQueries({ queryKey: ['rooms'] });
          } else {
            // Standard room update handling
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['room-availability'] });
            queryClient.invalidateQueries({ queryKey: ['room-types'] });
          }
        }
      )
      .subscribe();

    // Subscribe to reservation changes - immediate booking updates
    const reservationsChannel = supabase
      .channel('frontdesk-reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('Reservation changed, updating front desk data:', payload);
          
          // Special handling for cancellations and status changes
          if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
            console.log(`Reservation status changed from ${payload.old?.status} to ${payload.new?.status} for reservation ${payload.new?.id}`);
            
            // Enhanced invalidation for status changes that affect room availability
            if (payload.new?.status === 'cancelled' || payload.old?.status === 'cancelled' ||
                payload.new?.status === 'confirmed' || payload.old?.status === 'confirmed' ||
                payload.new?.status === 'checked_in' || payload.old?.status === 'checked_in' ||
                payload.new?.status === 'checked_out' || payload.old?.status === 'checked_out') {
              
              // Invalidate all related queries
              queryClient.invalidateQueries({ queryKey: ['reservations'] });
              queryClient.invalidateQueries({ queryKey: ['rooms'] });
              queryClient.invalidateQueries({ queryKey: ['guests'] });
              queryClient.invalidateQueries({ queryKey: ['group-reservations'] });
              queryClient.invalidateQueries({ queryKey: ['room-availability'] });
              queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
              
              // Force refetch for immediate UI update
              queryClient.refetchQueries({ queryKey: ['rooms'] });
              queryClient.refetchQueries({ queryKey: ['reservations'] });
            } else {
              // Standard reservation update handling
              queryClient.invalidateQueries({ queryKey: ['reservations'] });
              queryClient.invalidateQueries({ queryKey: ['rooms'] });
              queryClient.invalidateQueries({ queryKey: ['guests'] });
              queryClient.invalidateQueries({ queryKey: ['group-reservations'] });
            }
          } else {
            // Standard handling for new reservations or non-status updates
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['guests'] });
            queryClient.invalidateQueries({ queryKey: ['group-reservations'] });
          }
        }
      )
      .subscribe();

    // Subscribe to guest changes - immediate guest info updates
    const guestsChannel = supabase
      .channel('frontdesk-guests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('Guest info changed, updating front desk data:', payload);
          queryClient.invalidateQueries({ queryKey: ['guests'] });
          queryClient.invalidateQueries({ queryKey: ['guest-search'] });
          queryClient.invalidateQueries({ queryKey: ['recent-guests'] });
        }
      )
      .subscribe();

    // Subscribe to folio/payment changes - immediate billing updates
    const foliosChannel = supabase
      .channel('frontdesk-folios')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folios',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('Folio changed, updating billing data:', payload);
          queryClient.invalidateQueries({ queryKey: ['folios'] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances'] });
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
        }
      )
      .subscribe();

    // Subscribe to folio charges - immediate charge updates
    const folioChargesChannel = supabase
      .channel('frontdesk-folio-charges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folio_charges',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('Folio charge changed, updating billing data:', payload);
          queryClient.invalidateQueries({ queryKey: ['folios'] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances'] });
        }
      )
      .subscribe();

    // Subscribe to payment changes - immediate payment updates
    const paymentsChannel = supabase
      .channel('frontdesk-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('Payment received, updating financial data:', payload);
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['folios'] });
          queryClient.invalidateQueries({ queryKey: ['folio-balances'] });
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
        }
      )
      .subscribe();

    // Subscribe to housekeeping tasks - immediate task updates
    const housekeepingChannel = supabase
      .channel('frontdesk-housekeeping')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'housekeeping_tasks',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('Housekeeping task changed, updating task data:', payload);
          queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['rooms'] }); // Room status might change
        }
      )
      .subscribe();

    // Subscribe to QR requests - immediate service request updates
    const qrRequestsChannel = supabase
      .channel('frontdesk-qr-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_requests',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('QR request changed, updating service data:', payload);
          queryClient.invalidateQueries({ queryKey: ['qr-requests'] });
          queryClient.invalidateQueries({ queryKey: ['qr-orders'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up Front Desk realtime subscriptions');
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(guestsChannel);
      supabase.removeChannel(foliosChannel);
      supabase.removeChannel(folioChargesChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(housekeepingChannel);
      supabase.removeChannel(qrRequestsChannel);
    };
  }, [user, tenant, queryClient]);
}
