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
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_name,
          guest_phone,
          check_in_date,
          status,
          rooms!reservations_room_id_fkey (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('check_in_date', today)
        .order('check_in_date', { ascending: true });

      if (error) throw error;

      return data.map(reservation => ({
        id: reservation.id,
        guest_name: reservation.guest_name || 'Guest',
        room_number: reservation.rooms?.room_number || 'TBA',
        check_in_time: '14:00', // Default check-in time
        status: reservation.status === 'checked_in' ? 'checked_in' : 'pending',
        phone: reservation.guest_phone
      })) as TodayArrival[];
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};