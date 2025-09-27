import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();

  useEffect(() => {
    if (!user || !tenant) return;

    console.log('Setting up realtime subscriptions for tenant:', tenant.tenant_id);

    // Subscribe to reservation changes
    const reservationsChannel = supabase
      .channel('owner-dashboard-reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        () => {
          console.log('Reservation changed, invalidating dashboard data');
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
        }
      )
      .subscribe();

    // Subscribe to room status changes
    const roomsChannel = supabase
      .channel('owner-dashboard-rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        () => {
          console.log('Room status changed, invalidating dashboard data');
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
        }
      )
      .subscribe();

    // Subscribe to payment changes
    const paymentsChannel = supabase
      .channel('owner-dashboard-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        () => {
          console.log('Payment received, invalidating dashboard data');
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
        }
      )
      .subscribe();

    // Subscribe to shift session changes
    const shiftsChannel = supabase
      .channel('dashboard-shift-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_sessions',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        () => {
          console.log('Shift session changed, invalidating shift data');
          queryClient.invalidateQueries({ queryKey: ['shift-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
        }
      )
      .subscribe();

    // Subscribe to QR request changes
    const qrRequestsChannel = supabase
      .channel('dashboard-qr-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_requests',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        () => {
          console.log('QR request changed, invalidating QR data');
          queryClient.invalidateQueries({ queryKey: ['qr-requests'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(qrRequestsChannel);
    };
  }, [user, tenant, queryClient]);
}