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

      // Get hotel settings for notifications
      const { data: hotelSettings } = await supabase
        .from('hotel_settings')
        .select('front_desk_phone')
        .eq('tenant_id', user.user_metadata?.tenant_id)
        .single();

      // Get tenant info for notifications
      const { data: tenant } = await supabase
        .from('tenants')
        .select('hotel_name')
        .eq('tenant_id', user.user_metadata?.tenant_id)
        .single();

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

      // Create booking confirmation notification event
      const notificationEvent = {
        event_type: 'booking_confirmed',
        event_source: 'reservation',
        source_id: data.id,
        template_data: {
          guest_name: reservationData.guest_name,
          hotel_name: tenant?.hotel_name || 'Hotel',
          reservation_number: reservationNumber,
          room_number: 'TBA',
          check_in_date: reservationData.check_in_date,
          check_out_date: reservationData.check_out_date,
          total_amount: totalAmount,
          front_desk_phone: hotelSettings?.front_desk_phone
        },
        recipients: [
          {
            type: 'guest',
            email: reservationData.guest_email,
            phone: reservationData.guest_phone
          },
          {
            type: 'staff',
            role: 'FRONT_DESK',
            phone: hotelSettings?.front_desk_phone
          },
          {
            type: 'manager',
            role: 'MANAGER'
          }
        ],
        channels: ['sms', 'email'],
        priority: 'high'
      };

      // Create the notification event
      await supabase
        .from('notification_events')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          ...notificationEvent,
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          metadata: {}
        });

      // Schedule additional reminders
      try {
        // Schedule pre-arrival reminder (1 day before check-in)
        const checkInDate = new Date(reservationData.check_in_date);
        const reminderDate = new Date(checkInDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(10, 0, 0, 0);

        await supabase
          .from('notification_events')
          .insert({
            tenant_id: user.user_metadata?.tenant_id,
            event_type: 'pre_arrival_reminder',
            event_source: 'reservation',
            source_id: data.id,
            template_data: {
              guest_name: reservationData.guest_name,
              check_in_date: reservationData.check_in_date,
              reservation_number: reservationNumber,
              check_in_time: '14:00'
            },
            recipients: [
              {
                type: 'guest',
                email: reservationData.guest_email,
                phone: reservationData.guest_phone
              }
            ],
            channels: ['email', 'sms'],
            priority: 'medium',
            status: 'pending',
            scheduled_at: reminderDate.toISOString(),
            metadata: {}
          });

        // Schedule checkout reminder (on checkout day)
        const checkOutDate = new Date(reservationData.check_out_date);
        checkOutDate.setHours(9, 0, 0, 0);

        await supabase
          .from('notification_events')
          .insert({
            tenant_id: user.user_metadata?.tenant_id,
            event_type: 'checkout_reminder',
            event_source: 'reservation',
            source_id: data.id,
            template_data: {
              guest_name: reservationData.guest_name,
              check_out_date: reservationData.check_out_date,
              check_out_time: '12:00',
              total_amount: totalAmount
            },
            recipients: [
              {
                type: 'guest',
                email: reservationData.guest_email,
                phone: reservationData.guest_phone
              }
            ],
            channels: ['email'],
            priority: 'low',
            status: 'pending',
            scheduled_at: checkOutDate.toISOString(),
            metadata: {}
          });

      } catch (reminderError) {
        console.warn('Failed to schedule reminder notifications:', reminderError);
        // Don't fail the reservation creation if reminders fail
      }

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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get reservation details for validation and notification
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*, rooms(room_number, status)')
        .eq('id', reservationId)
        .single();

      if (resError) throw resError;
      if (!reservation) throw new Error('Reservation not found');

      // Validation: Prevent cancelling checked-in reservations
      if (reservation.status === 'checked_in') {
        throw new Error('Cannot cancel a checked-in reservation. Please check out the guest first.');
      }

      // Validation: Prevent cancelling already cancelled reservations
      if (reservation.status === 'cancelled') {
        throw new Error('This reservation has already been cancelled.');
      }

      // Update reservation status to cancelled
      // The database trigger will automatically handle room status updates
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select('*, rooms(room_number, status)')
        .single();

      if (error) throw error;

      // Log cancellation for audit trail
      await supabase.from('audit_log').insert([{
        action: 'RESERVATION_CANCELLED',
        resource_type: 'RESERVATION',
        resource_id: reservationId,
        actor_id: user.id,
        tenant_id: user.user_metadata?.tenant_id,
        description: `Reservation ${reservation.reservation_number} for ${reservation.guest_name} was cancelled`,
        old_values: { status: reservation.status },
        new_values: { status: 'cancelled' },
        metadata: {
          room_id: reservation.room_id,
          room_number: reservation.rooms?.room_number,
          guest_name: reservation.guest_name,
          check_in_date: reservation.check_in_date
        }
      }]);

      // Create cancellation notification event
      const notificationEvent = {
        event_type: 'reservation_cancelled',
        event_source: 'reservation',
        source_id: reservationId,
        template_data: {
          guest_name: reservation.guest_name,
          reservation_number: reservation.reservation_number,
          room_number: reservation.rooms?.room_number || 'TBA',
          check_in_date: reservation.check_in_date,
          cancellation_reason: 'Guest cancellation',
          cancellation_date: new Date().toISOString().split('T')[0]
        },
        recipients: [
          {
            type: 'guest',
            email: reservation.guest_email,
            phone: reservation.guest_phone
          },
          {
            type: 'staff',
            role: 'FRONT_DESK'
          },
          {
            type: 'staff',
            role: 'MANAGER'
          }
        ],
        channels: ['sms', 'email'],
        priority: 'medium'
      };

      // Create the notification event
      await supabase
        .from('notification_events')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          ...notificationEvent,
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          metadata: {}
        });

      return { ...data, originalReservation: reservation };
    },
    onSuccess: (data) => {
      // Enhanced real-time updates for immediate UI refresh
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['guest-analytics'] });
      
      toast({
        title: "Reservation Cancelled",
        description: `Reservation for ${data.originalReservation?.guest_name} has been cancelled. Room status updated automatically.`
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