import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface TodayArrival {
  id: string;
  guest_name: string;
  room_number: string;
  check_in_time: string;
  status: 'pending' | 'checked_in';
  phone?: string;
}

export const useTodayArrivals = () => {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['today-arrivals', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const today = new Date().toISOString().split('T')[0];
      
      // PHASE 1.1: Multi-status, multi-day arrival logic
      // Show confirmed/pending checking in today OR already checked-in guests who arrived earlier
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_name,
          guest_phone,
          check_in_date,
          check_out_date,
          status,
          rooms!reservations_room_id_fkey (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .or(`and(check_in_date.eq.${today},status.in.(confirmed,pending)),and(status.eq.checked_in,check_in_date.lte.${today},check_out_date.gt.${today})`)
        .order('check_in_date', { ascending: true });

      if (error) throw error;

      return data.map(reservation => ({
        id: reservation.id,
        guest_name: reservation.guest_name || 'Guest',
        room_number: reservation.rooms?.room_number || 'TBA',
        check_in_time: '14:00', // Default check-in time
        status: reservation.status as 'pending' | 'checked_in',
        phone: reservation.guest_phone
      })) as TodayArrival[];
    },
    enabled: !!tenant?.tenant_id,
    staleTime: 120000, // Phase 7: 2 minutes stale time
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });
};