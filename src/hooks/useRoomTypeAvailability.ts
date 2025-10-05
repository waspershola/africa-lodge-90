import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { format } from 'date-fns';

export interface RoomTypeAvailability {
  room_type_id: string;
  room_type_name: string;
  total_inventory: number;
  available_count: number;
  reserved_count: number;
  blocked_count: number;
  can_book: boolean;
  availability_status: 'available' | 'limited' | 'sold_out' | 'on_request';
  base_rate: number;
  max_occupancy: number;
}

/**
 * Professional room type availability hook
 * Returns detailed inventory status including total, reserved, blocked, and available counts
 */
export const useRoomTypeAvailability = (
  checkInDate: Date | undefined,
  checkOutDate: Date | undefined
) => {
  const { tenant } = useAuth();
  
  return useQuery({
    queryKey: [
      'room-type-availability', 
      tenant?.tenant_id, 
      checkInDate ? format(checkInDate, 'yyyy-MM-dd') : null,
      checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : null
    ],
    queryFn: async () => {
      if (!tenant?.tenant_id || !checkInDate || !checkOutDate) return [];
      
      console.log('[Room Type Availability] Fetching availability:', {
        tenantId: tenant.tenant_id,
        checkIn: format(checkInDate, 'yyyy-MM-dd'),
        checkOut: format(checkOutDate, 'yyyy-MM-dd'),
      });
      
      const { data, error } = await supabase.rpc('get_room_type_availability', {
        p_tenant_id: tenant.tenant_id,
        p_check_in_date: format(checkInDate, 'yyyy-MM-dd'),
        p_check_out_date: format(checkOutDate, 'yyyy-MM-dd')
      });
      
      if (error) {
        console.error('[Room Type Availability] Error:', error);
        throw error;
      }
      
      console.log('[Room Type Availability] Results:', data);
      return (data || []) as RoomTypeAvailability[];
    },
    enabled: !!tenant?.tenant_id && !!checkInDate && !!checkOutDate,
    staleTime: 10000, // Cache for 10 seconds
  });
};
