import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface Overstay {
  id: string;
  guest_name: string;
  room_number: string;
  hours_over: number;
  phone?: string;
  check_out_date: string;
  status: string;
}

/**
 * Phase 1.3: Dedicated Overstay Detection Hook
 * Finds all checked-in guests past their checkout date
 */
export const useOverstays = () => {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['overstays', tenant?.tenant_id],
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
          rooms!reservations_room_id_fkey (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'checked_in')
        .lt('check_out_date', today)
        .order('check_out_date', { ascending: true });

      if (error) throw error;

      return data.map(reservation => {
        const checkoutDate = new Date(reservation.check_out_date);
        const now = new Date();
        const hoursOver = Math.floor((now.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60));

        return {
          id: reservation.id,
          guest_name: reservation.guest_name || 'Guest',
          room_number: reservation.rooms?.room_number || 'Unknown',
          hours_over: hoursOver,
          phone: reservation.guest_phone,
          check_out_date: reservation.check_out_date,
          status: 'overstay'
        };
      }) as Overstay[];
    },
    enabled: !!tenant?.tenant_id,
    staleTime: 60000, // Phase 7: 1 minute stale time
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });
};
