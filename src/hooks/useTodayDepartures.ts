import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface TodayDeparture {
  id: string;
  guest_name: string;
  room_number: string;
  check_out_time: string;
  status: 'pending' | 'checked_out';
  phone?: string;
}

export const useTodayDepartures = () => {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['today-departures', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_name,
          guest_phone,
          check_out_date,
          status,
          rooms!inner (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('check_out_date', today)
        .order('check_out_date', { ascending: true });

      if (error) throw error;

      return data.map(reservation => ({
        id: reservation.id,
        guest_name: reservation.guest_name || 'Guest',
        room_number: reservation.rooms?.room_number || 'Unknown',
        check_out_time: '12:00', // Default check-out time
        status: reservation.status === 'checked_out' ? 'checked_out' : 'pending',
        phone: reservation.guest_phone
      })) as TodayDeparture[];
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};