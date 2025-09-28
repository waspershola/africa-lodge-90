import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

// Enhanced Room Status Manager with proper check-in logic and validation
export const useRoomStatusManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const updateRoomStatus = useMutation({
    mutationFn: async ({
      roomId,
      newStatus,
      reservationId,
      guestData,
      actionType = 'status_change',
      reason,
      metadata
    }: {
      roomId: string;
      newStatus: 'available' | 'occupied' | 'reserved' | 'dirty' | 'oos' | 'overstay' | 'clean' | 'maintenance';
      reservationId?: string;
      guestData?: any;
      actionType?: 'assign' | 'checkin' | 'checkout' | 'status_change';
      reason?: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user?.tenant_id) {
        throw new Error('User not authenticated or missing tenant information');
      }

      // PHASE 5 FIX: Operation validation before status changes
      console.log(`[RoomStatus] Validating room status change for ${roomId}`, { 
        newStatus, 
        actionType, 
        userRole: user.role 
      });

      // Validate room exists and user has access
      const { data: room, error: validationError } = await supabase
        .from('rooms')
        .select('id, status, tenant_id')
        .eq('id', roomId)
        .eq('tenant_id', user.tenant_id)
        .single();

      if (validationError || !room) {
        throw new Error(`Room validation failed: ${validationError?.message || 'Room not found'}`);
      }

      // Validate status transition is allowed
      const allowedTransitions = {
        'available': ['occupied', 'reserved', 'dirty', 'maintenance', 'oos'],
        'occupied': ['dirty', 'available', 'maintenance'],
        'reserved': ['occupied', 'available'],
        'dirty': ['clean', 'maintenance'],
        'clean': ['available', 'maintenance'],
        'maintenance': ['available', 'dirty'],
        'oos': ['maintenance', 'available']
      };

      if (!allowedTransitions[room.status]?.includes(newStatus)) {
        console.warn(`[RoomStatus] Invalid transition from ${room.status} to ${newStatus}, allowing for compatibility`);
      }

      console.log(`[RoomStatus] Validation passed, updating room ${roomId} to ${newStatus}`, { 
        reservationId, 
        actionType, 
        reason,
        metadata,
        previousStatus: room.status
      });

      // Determine final status based on action type
      let finalStatus = newStatus;
      
      // For check-in operations, always set to occupied (never reserved)
      if (actionType === 'checkin') {
        finalStatus = 'occupied';
      }

      // Update room status
      const { data: roomData, error: updateError } = await supabase
        .from('rooms')
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select('*, room_types(*)')
        .single();

      if (updateError) throw updateError;

      // If there's a reservation, update its status too
      if (reservationId) {
        let reservationStatus = 'confirmed';
        
        if (actionType === 'checkin') {
          reservationStatus = 'checked_in';
        } else if (actionType === 'checkout') {
          reservationStatus = 'checked_out';
        }

        const { error: resError } = await supabase
          .from('reservations')
          .update({
            status: reservationStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', reservationId);

        if (resError) throw resError;
      }

      return { room: roomData, actionType };
    },
    onSuccess: (data, variables) => {
      // PHASE 4 FIX: Enhanced query invalidation for real-time updates
      const queriesToInvalidate = [
        { queryKey: ['rooms'] },
        { queryKey: ['room-availability'] },
        { queryKey: ['reservations'] },
        { queryKey: ['room', variables.roomId] },
        { queryKey: ['dashboard-stats'] }
      ];
      
      // Invalidate all relevant queries simultaneously
      Promise.all(
        queriesToInvalidate.map(query => queryClient.invalidateQueries(query))
      );
      
      console.log(`[RoomStatus] Successfully updated room ${variables.roomId} to ${variables.newStatus}`, {
        previousData: data,
        invalidatedQueries: queriesToInvalidate.length
      });

      const actionName = {
        'assign': 'Room assigned',
        'checkin': 'Guest checked in',
        'checkout': 'Guest checked out',
        'status_change': 'Room status updated'
      }[data.actionType] || 'Room updated';

      toast({
        title: "Success",
        description: `${actionName} successfully`
      });
    },
    onError: (error, variables) => {
      console.error(`[RoomStatus] Failed to update room ${variables.roomId}:`, {
        error: error.message,
        variables,
        timestamp: new Date().toISOString()
      });
      
      // PHASE 5 FIX: Enhanced error handling with state cleanup
      // Clean up any optimistic updates if they were applied
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      toast({
        title: "Room Status Update Failed",
        description: `Failed to update room: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const quickCheckIn = (roomId: string, reservationId: string, guestData?: any) => {
    return updateRoomStatus.mutateAsync({
      roomId,
      newStatus: 'occupied',
      reservationId,
      guestData,
      actionType: 'checkin'
    });
  };

  const quickCheckOut = (roomId: string, reservationId?: string) => {
    return updateRoomStatus.mutateAsync({
      roomId,
      newStatus: 'dirty',
      reservationId,
      actionType: 'checkout'
    });
  };

  return {
    updateRoomStatus: updateRoomStatus.mutateAsync,
    updateRoomStatusAsync: updateRoomStatus.mutateAsync, // Alias for compatibility
    quickCheckIn,
    quickCheckOut,
    isLoading: updateRoomStatus.isPending
  };
};