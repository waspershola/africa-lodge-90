import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Enhanced Room Status Manager with proper check-in logic
export const useRoomStatusManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Determine final status based on action type
      let finalStatus = newStatus;
      
      // For check-in operations, always set to occupied (never reserved)
      if (actionType === 'checkin') {
        finalStatus = 'occupied';
      }

      // Update room status
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select('*, room_types(*)')
        .single();

      if (roomError) throw roomError;

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
    onSuccess: (data) => {
      // Invalidate all relevant queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });

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
    onError: (error) => {
      console.error('Room status update error:', error);
      toast({
        title: "Error",
        description: `Failed to update room: ${error.message}`,
        variant: "destructive"
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