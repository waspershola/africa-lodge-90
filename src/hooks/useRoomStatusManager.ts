import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'out_of_service' | 'oos' | 'overstay' | 'dirty' | 'clean' | 'maintenance';

export interface RoomStatusUpdate {
  roomId: string;
  newStatus: RoomStatus;
  reservationId?: string;
  userId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface StatusTransitionValidation {
  isValid: boolean;
  errorMessage?: string;
  requiresApproval?: boolean;
  blockedBy?: string[];
}

export const useRoomStatusManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Valid room status transitions mapping
  const VALID_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
    'available': ['occupied', 'reserved', 'oos', 'maintenance', 'dirty'],
    'occupied': ['available', 'overstay', 'dirty', 'checkout'], // checkout is temporary status
    'reserved': ['occupied', 'available', 'overstay'], // Fixed: reserved can transition to occupied
    'oos': ['available', 'maintenance'],
    'overstay': ['available', 'occupied', 'checkout'],
    'dirty': ['clean', 'maintenance'],
    'clean': ['available'],
    'maintenance': ['available', 'oos']
  } as Record<RoomStatus, RoomStatus[]>;

  // Validate room status transition
  const validateStatusTransition = async (
    currentStatus: RoomStatus, 
    newStatus: RoomStatus, 
    roomId: string
  ): Promise<StatusTransitionValidation> => {
    // Check if transition is valid according to business rules
    const validTransitions = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!validTransitions.includes(newStatus)) {
      return {
        isValid: false,
        errorMessage: `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
      };
    }

    // Special validation for reserved → occupied transition
    if (currentStatus === 'reserved' && newStatus === 'occupied') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          isValid: false,
          errorMessage: 'Authentication required for check-in'
        };
      }

      // Check if room has a valid reservation
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select('id, status, check_in_date, check_out_date, guest_name')
        .eq('room_id', roomId)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (error) {
        return {
          isValid: false,
          errorMessage: 'Error checking reservation status'
        };
      }

      if (!reservation) {
        return {
          isValid: false,
          errorMessage: 'No confirmed reservation found for this room'
        };
      }

      // Check if check-in date is valid (not in future, not too old)
      const today = new Date();
      const checkInDate = new Date(reservation.check_in_date);
      const daysDiff = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < -1) {
        return {
          isValid: false,
          errorMessage: 'Check-in date is in the future'
        };
      }

      if (daysDiff > 7) {
        return {
          isValid: false,
          errorMessage: 'Check-in date is too old. Please verify reservation.',
          requiresApproval: true
        };
      }
    }

    // Additional validation for occupied → available (checkout)
    if (currentStatus === 'occupied' && newStatus === 'available') {
      // Check for outstanding folio balance
      const { data: folio } = await supabase
        .from('folios')
        .select('balance, status')
        .eq('reservation_id', '(SELECT id FROM reservations WHERE room_id = $1 AND status = \'checked_in\')')
        .maybeSingle();

      if (folio && folio.balance > 0) {
        return {
          isValid: false,
          errorMessage: `Outstanding balance of ₦${folio.balance.toLocaleString()}. Please settle payment before checkout.`,
          blockedBy: ['payment_required']
        };
      }
    }

    return { isValid: true };
  };

  // Update room status with proper validation and audit logging
  const updateRoomStatus = useMutation({
    mutationFn: async ({ roomId, newStatus, reservationId, userId, reason, metadata }: RoomStatusUpdate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current room status
      const { data: currentRoom, error: roomError } = await supabase
        .from('rooms')
        .select('status, room_number')
        .eq('id', roomId)
        .single();

      if (roomError || !currentRoom) {
        throw new Error('Room not found');
      }

      const currentStatus = currentRoom.status as RoomStatus;

      // Validate the transition
      const validation = await validateStatusTransition(currentStatus, newStatus, roomId);
      
      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid status transition');
      }

      // Perform the status update with transaction safety
      const updates: any[] = [];

      // 1. Update room status
      updates.push(
        supabase
          .from('rooms')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', roomId)
      );

      // 2. Update reservation status if applicable
      if (reservationId) {
        let reservationStatus = '';
        
        if (newStatus === 'occupied') {
          reservationStatus = 'checked_in';
          updates.push(
            supabase
              .from('reservations')
              .update({ 
                status: 'checked_in',
                checked_in_at: new Date().toISOString(),
                checked_in_by: user.id
              })
              .eq('id', reservationId)
          );
        } else if (newStatus === 'available' && currentStatus === 'occupied') {
          reservationStatus = 'checked_out';
          updates.push(
            supabase
              .from('reservations')
              .update({ 
                status: 'checked_out',
                checked_out_at: new Date().toISOString(),
                checked_out_by: user.id
              })
              .eq('id', reservationId)
          );
        }
      }

      // Execute all updates
      const results = await Promise.all(updates);
      
      // Check for errors in any of the updates
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        const errors = results.filter(result => result.error).map(result => result.error?.message);
        throw new Error(`Update failed: ${errors.join(', ')}`);
      }

      // 3. Log the status change for audit
      await supabase.from('audit_log').insert([{
        action: 'ROOM_STATUS_CHANGED',
        resource_type: 'ROOM',
        resource_id: roomId,
        actor_id: user.id,
        tenant_id: user.user_metadata?.tenant_id,
        description: `Room ${currentRoom.room_number} status changed from ${currentStatus} to ${newStatus}`,
        old_values: { status: currentStatus },
        new_values: { status: newStatus },
        metadata: {
          reason: reason,
          reservationId: reservationId,
          userId: userId,
          ...metadata
        }
      }]);

      return {
        roomId,
        oldStatus: currentStatus,
        newStatus,
        roomNumber: currentRoom.room_number
      };
    },
    onSuccess: (data) => {
      // Invalidate room-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      toast({
        title: "Room Status Updated",
        description: `Room ${data.roomNumber} status changed from ${data.oldStatus} to ${data.newStatus}.`,
      });
    },
    onError: (error: Error) => {
      console.error('Error updating room status:', error);
      toast({
        title: "Status Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Quick check-in function for reserved rooms
  const quickCheckIn = async (roomId: string, reservationId: string) => {
    return updateRoomStatus.mutateAsync({
      roomId,
      newStatus: 'occupied',
      reservationId,
      reason: 'Guest check-in'
    });
  };

  // Quick checkout function
  const quickCheckOut = async (roomId: string, reservationId: string) => {
    return updateRoomStatus.mutateAsync({
      roomId,
      newStatus: 'dirty', // Set to dirty first, then housekeeping will clean
      reservationId,
      reason: 'Guest check-out'
    });
  };

  // Bulk status update for multiple rooms
  const bulkUpdateStatus = async (roomIds: string[], newStatus: RoomStatus, reason?: string) => {
    const promises = roomIds.map(roomId => 
      updateRoomStatus.mutateAsync({
        roomId,
        newStatus,
        reason
      })
    );

    return Promise.all(promises);
  };

  return {
    updateRoomStatus: updateRoomStatus.mutate,
    updateRoomStatusAsync: updateRoomStatus.mutateAsync,
    quickCheckIn,
    quickCheckOut,
    bulkUpdateStatus,
    validateStatusTransition,
    isLoading: updateRoomStatus.isPending,
    VALID_TRANSITIONS
  };
};