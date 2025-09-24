import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateReservationData {
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  guest_id_number?: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  room_rate: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests?: string;
}

export interface UpdateReservationData extends Partial<CreateReservationData> {
  id: string;
  total_amount?: number;
}

// Hook to create a new reservation
export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservationData: CreateReservationData) => {
      // Get current user to add tenant_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Calculate total amount
      const checkInDate = new Date(reservationData.check_in_date);
      const checkOutDate = new Date(reservationData.check_out_date);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * reservationData.room_rate;

      // Generate reservation number
      const reservationNumber = `RES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          guest_name: reservationData.guest_name,
          guest_email: reservationData.guest_email,
          guest_phone: reservationData.guest_phone,
          room_id: reservationData.room_id,
          check_in_date: reservationData.check_in_date,
          check_out_date: reservationData.check_out_date,
          adults: reservationData.adults,
          children: reservationData.children,
          room_rate: reservationData.room_rate,
          total_amount: totalAmount,
          reservation_number: reservationNumber,
          status: reservationData.status,
          special_requests: reservationData.special_requests
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] }); // Refresh rooms to update availability
      toast({
        title: "Success",
        description: "Reservation created successfully"
      });
    },
    onError: (error) => {
      console.error('Reservation creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create reservation",
        variant: "destructive"
      });
    }
  });
};

// Hook to update a reservation
export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservationData: UpdateReservationData) => {
      const { id, ...updateData } = reservationData;
      
      // Recalculate total if dates or rate changed
      if (updateData.check_in_date && updateData.check_out_date && updateData.room_rate) {
        const checkInDate = new Date(updateData.check_in_date);
        const checkOutDate = new Date(updateData.check_out_date);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        updateData.total_amount = nights * updateData.room_rate;
      }

      const { data, error } = await supabase
        .from('reservations')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Reservation updated successfully"
      });
    },
    onError: (error) => {
      console.error('Reservation update error:', error);
      toast({
        title: "Error",
        description: "Failed to update reservation",
        variant: "destructive"
      });
    }
  });
};

// Hook to cancel a reservation
export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Reservation cancelled successfully"
      });
    },
    onError: (error) => {
      console.error('Reservation cancellation error:', error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation",
        variant: "destructive"
      });
    }
  });
};