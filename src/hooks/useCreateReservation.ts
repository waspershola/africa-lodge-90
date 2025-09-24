import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateReservationData {
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children?: number;
  room_rate: number;
  special_requests?: string;
  booking_source?: string;
  status?: string;
}

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReservationData) => {
      // Generate reservation number
      const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
          guest_name: data.guest_name,
          guest_email: data.guest_email,
          guest_phone: data.guest_phone,
          room_id: data.room_id,
          check_in_date: data.check_in_date,
          check_out_date: data.check_out_date,
          adults: data.adults,
          children: data.children || 0,
          room_rate: data.room_rate,
          status: data.status || 'confirmed',
          reservation_number: reservationNumber,
          tenant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.tenant_id
        })
        .select()
        .single();

      if (error) throw error;
      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Reservation created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create reservation: ${error.message}`);
    }
  });
};