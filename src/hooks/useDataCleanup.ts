import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface RoomStatusInconsistency {
  room_id: string;
  room_number: string;
  room_status: string;
  active_reservations: number;
  expected_status: string;
  inconsistent: boolean;
  reservation_ids: string[];
}

/**
 * Hook to detect and fix data inconsistencies in room/reservation status
 */
export const useDataCleanup = () => {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Detect inconsistencies
  const { data: inconsistencies, isLoading: isCheckingInconsistencies } = useQuery({
    queryKey: ['data-inconsistencies', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          status,
          reservations:reservations(id, status, check_in_date, check_out_date)
        `)
        .eq('tenant_id', tenant.tenant_id);

      if (roomsError) throw roomsError;

      return rooms?.map(room => {
        const activeReservations = room.reservations?.filter(
          (r: any) => r.status === 'confirmed' || r.status === 'checked_in'
        ) || [];

        const reservationIds = activeReservations.map((r: any) => r.id);
        
        let expectedStatus = room.status;
        let inconsistent = false;

        // Basic validation rules
        if (activeReservations.length === 0 && room.status === 'occupied') {
          expectedStatus = 'available';
          inconsistent = true;
        } else if (activeReservations.length > 0 && room.status === 'available') {
          expectedStatus = activeReservations.some((r: any) => r.status === 'checked_in') 
            ? 'occupied' : 'reserved';
          inconsistent = true;
        } else if (activeReservations.length > 1) {
          // Multiple active reservations is always inconsistent
          inconsistent = true;
        }

        return {
          room_id: room.id,
          room_number: room.room_number,
          room_status: room.status,
          active_reservations: activeReservations.length,
          expected_status: expectedStatus,
          inconsistent,
          reservation_ids: reservationIds
        } as RoomStatusInconsistency;
      }) || [];
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 30000 // Check every 30 seconds
  });

  // Fix inconsistencies
  const fixInconsistencies = useMutation({
    mutationFn: async () => {
      if (!inconsistencies || inconsistencies.length === 0) return;

      const fixPromises = inconsistencies
        .filter(item => item.inconsistent)
        .map(async (item) => {
          try {
            // If room has no reservations but is marked occupied, mark as available
            if (item.active_reservations === 0 && item.room_status === 'occupied') {
              await supabase
                .from('rooms')
                .update({ status: 'available' })
                .eq('id', item.room_id);
              
              return { room_id: item.room_id, action: 'marked_available', success: true };
            }
            
            // If room has reservations but is marked available, update status
            if (item.active_reservations > 0 && item.room_status === 'available') {
              await supabase
                .from('rooms')
                .update({ status: item.expected_status })
                .eq('id', item.room_id);
              
              return { room_id: item.room_id, action: 'updated_status', success: true };
            }
            
            // If room has multiple reservations, cancel the extras (keep most recent)
            if (item.active_reservations > 1) {
              const sortedReservations = item.reservation_ids.slice(1); // Keep first, cancel rest
              
              await Promise.all(sortedReservations.map(reservationId =>
                supabase
                  .from('reservations')
                  .update({ 
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                  })
                  .eq('id', reservationId)
              ));
              
              return { room_id: item.room_id, action: 'cancelled_extras', success: true };
            }

            return { room_id: item.room_id, action: 'no_action_needed', success: true };
          } catch (error) {
            console.error(`Failed to fix inconsistency for room ${item.room_number}:`, error);
            return { room_id: item.room_id, action: 'failed', success: false, error };
          }
        });

      const results = await Promise.all(fixPromises);
      return results;
    },
    onSuccess: (results) => {
      const successful = results?.filter(r => r.success).length || 0;
      const failed = results?.filter(r => !r.success).length || 0;
      
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['data-inconsistencies'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      toast({
        title: "Data Cleanup Complete",
        description: `Fixed ${successful} inconsistencies. ${failed > 0 ? `${failed} failed.` : ''}`,
        variant: failed > 0 ? "destructive" : "default"
      });
    },
    onError: (error) => {
      console.error('Data cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to fix data inconsistencies",
        variant: "destructive"
      });
    }
  });

  // Force sync room statuses with current reservations
  const syncRoomStatuses = useMutation({
    mutationFn: async () => {
      if (!tenant?.tenant_id) throw new Error('Not authenticated');

      // Get all rooms with their current reservations
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          status,
          reservations:reservations(status, check_in_date, check_out_date)
        `)
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;

      const updates = rooms?.map(room => {
        const activeReservation = room.reservations?.find(
          (r: any) => r.status === 'checked_in' || r.status === 'confirmed'
        );

        let correctStatus = 'available';
        if (activeReservation) {
          if (activeReservation.status === 'checked_in') {
            correctStatus = 'occupied';
          } else if (activeReservation.status === 'confirmed') {
            correctStatus = 'reserved';
          }
        }

        // Only update if status is different
        if (room.status !== correctStatus) {
          return {
            id: room.id,
            room_number: room.room_number,
            current_status: room.status,
            correct_status: correctStatus
          };
        }
        return null;
      }).filter(Boolean) || [];

      // Apply updates
      if (updates.length > 0) {
        await Promise.all(
          updates.map(update =>
            supabase
              .from('rooms')
              .update({ status: update.correct_status })
              .eq('id', update.id)
          )
        );
      }

      return updates;
    },
    onSuccess: (updates) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['data-inconsistencies'] });
      
      toast({
        title: "Room Status Sync Complete",
        description: `Updated ${updates?.length || 0} room statuses`,
      });
    },
    onError: (error) => {
      console.error('Status sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync room statuses",
        variant: "destructive"
      });
    }
  });

  return {
    inconsistencies: inconsistencies?.filter(item => item.inconsistent) || [],
    totalInconsistencies: inconsistencies?.filter(item => item.inconsistent).length || 0,
    isCheckingInconsistencies,
    fixInconsistencies,
    syncRoomStatuses,
    isFixing: fixInconsistencies.isPending,
    isSyncing: syncRoomStatuses.isPending
  };
};
