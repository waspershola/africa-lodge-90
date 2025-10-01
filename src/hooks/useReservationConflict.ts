import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface ReservationConflict {
  has_conflict: boolean;
  conflicting_reservation_id: string | null;
  conflict_details: string;
}

/**
 * Phase 5: Reservation Conflict Detection Hook
 * Checks for overlapping reservations before booking
 */
export function useReservationConflict(
  roomId: string | null,
  checkInDate: string | null,
  checkOutDate: string | null,
  excludeReservationId?: string
) {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: [
      'reservation-conflict',
      tenant?.tenant_id,
      roomId,
      checkInDate,
      checkOutDate,
      excludeReservationId,
    ],
    queryFn: async () => {
      if (!tenant?.tenant_id || !roomId || !checkInDate || !checkOutDate) {
        return {
          has_conflict: false,
          conflicting_reservation_id: null,
          conflict_details: 'Insufficient data for conflict check',
        };
      }

      console.log('[Reservation Conflict] Checking for conflicts:', {
        roomId,
        checkInDate,
        checkOutDate,
        excludeReservationId,
      });

      const { data, error } = await supabase.rpc('check_reservation_conflict', {
        p_tenant_id: tenant.tenant_id,
        p_room_id: roomId,
        p_check_in_date: checkInDate,
        p_check_out_date: checkOutDate,
        p_exclude_reservation_id: excludeReservationId || null,
      });

      if (error) {
        console.error('[Reservation Conflict] Error checking conflicts:', error);
        throw error;
      }

      const result = data?.[0] as ReservationConflict;
      
      if (result?.has_conflict) {
        console.warn('[Reservation Conflict] Conflict detected:', result);
      } else {
        console.log('[Reservation Conflict] No conflicts found');
      }

      return result;
    },
    enabled: !!tenant?.tenant_id && !!roomId && !!checkInDate && !!checkOutDate,
    staleTime: 30000, // Cache for 30 seconds
  });
}
