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

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [user, tenant, queryClient]);
}