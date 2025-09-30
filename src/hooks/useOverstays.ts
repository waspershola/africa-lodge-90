import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface Overstay {
  id: string;
  guest_name: string;
  room_number: string;
  checkout_time: string;
  hours_over: number;
  phone?: string;
}

export const useOverstays = () => {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['overstays', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const now = new Date();
      
      // Get all checked-in reservations
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
        .eq('status', 'checked_in')
        .order('check_out_date', { ascending: true });

      if (error) throw error;

      // Filter and calculate overstays using DB function for timezone-aware logic
      const overstays: Overstay[] = [];
      
      for (const reservation of data || []) {
        try {
          // Use DB function to check if reservation is in overstay
          const { data: isOverstay, error: overstayError } = await supabase
            .rpc('calculate_reservation_overstay', {
              p_reservation_id: reservation.id
            });

          if (overstayError) {
            console.error('[Overstay Check] Error for reservation:', reservation.id, overstayError);
            continue;
          }

          if (isOverstay) {
            // Calculate hours over using timezone-aware checkout time (12:00 PM)
            const checkoutDate = new Date(reservation.check_out_date + 'T12:00:00');
            const hoursOver = Math.floor((now.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60));
            
            overstays.push({
              id: reservation.id,
              guest_name: reservation.guest_name || 'Guest',
              room_number: reservation.rooms?.room_number || 'Unknown',
              checkout_time: '12:00',
              hours_over: Math.max(0, hoursOver),
              phone: reservation.guest_phone
            });
          }
        } catch (err) {
          console.error('[Overstay Check] Unexpected error:', err);
        }
      }

      return overstays;
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};