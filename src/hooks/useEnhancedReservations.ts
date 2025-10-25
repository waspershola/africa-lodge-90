// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePaymentCalculator } from './usePaymentPolicies';

export interface EnhancedReservationData {
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
  payment_policy_id?: string;
  payment_option?: 'full' | 'deposit' | 'none';
  group_reservation_id?: string;
}

export interface GroupReservationData {
  group_name: string;
  organizer_name: string;
  organizer_email?: string;
  organizer_phone?: string;
  check_in_date: string;
  check_out_date: string;
  payment_mode: 'organizer_pays' | 'split_individual' | 'hybrid';
  special_requests?: string;
  guests: Array<{
    name: string;
    email?: string;
    phone?: string;
    room_type_id: string;
    adults: number;
    children: number;
    individual_payment?: boolean;
  }>;
}

export interface ReservationInvoice {
  id: string;
  reservation_id: string;
  invoice_number: string;
  invoice_type: 'reservation' | 'deposit' | 'balance';
  amount: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  due_date?: string;
  payment_instructions?: string;
  sent_to_email?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
}

// Hook to create enhanced reservation with payment handling
export const useCreateEnhancedReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { calculatePayment } = usePaymentCalculator();

  return useMutation({
    mutationFn: async (reservationData: EnhancedReservationData) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get payment policy
      let paymentPolicy = null;
      if (reservationData.payment_policy_id) {
        const { data: policy } = await supabase
          .from('payment_policies')
          .select('*')
          .eq('id', reservationData.payment_policy_id)
          .single();
        paymentPolicy = policy;
      } else {
        // Use default policy
        const { data: policy } = await supabase
          .from('payment_policies')
          .select('*')
          .eq('tenant_id', user.user_metadata?.tenant_id)
          .eq('is_default', true)
          .single();
        paymentPolicy = policy;
      }

      // Calculate amounts
      const checkInDate = new Date(reservationData.check_in_date);
      const checkOutDate = new Date(reservationData.check_out_date);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * reservationData.room_rate;

      const paymentCalc = paymentPolicy 
        ? calculatePayment(totalAmount, paymentPolicy as any, reservationData.payment_option)
        : { totalAmount, depositAmount: 0, balanceDue: totalAmount, paymentStatus: 'pending' };

      // Generate reservation number
      const reservationNumber = `RES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Calculate payment due date
      const paymentDueDate = paymentPolicy?.auto_cancel_hours 
        ? new Date(Date.now() + paymentPolicy.auto_cancel_hours * 60 * 60 * 1000)
        : null;

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
          total_amount: paymentCalc.totalAmount,
          reservation_number: reservationNumber,
          status: reservationData.status,
          special_requests: reservationData.special_requests,
          payment_policy_id: paymentPolicy?.id,
          payment_status: paymentCalc.paymentStatus,
          deposit_amount: paymentCalc.depositAmount,
          balance_due: paymentCalc.balanceDue,
          payment_due_date: paymentDueDate?.toISOString().split('T')[0],
          group_reservation_id: reservationData.group_reservation_id
        })
        .select()
        .single();

      if (error) throw error;

      // Get hotel settings and tenant info for notifications
      const { data: hotelSettings } = await supabase
        .from('hotel_settings')
        .select('front_desk_phone')
        .eq('tenant_id', user.user_metadata?.tenant_id)
        .single();

      const { data: tenant } = await supabase
        .from('tenants')
        .select('hotel_name')
        .eq('tenant_id', user.user_metadata?.tenant_id)
        .single();

      // Create initial invoice if payment is required
      if (paymentCalc.depositAmount > 0) {
        const invoiceNumber = `INV-${reservationNumber.replace('RES-', '')}`;
        await supabase
          .from('reservation_invoices')
          .insert({
            tenant_id: user.user_metadata?.tenant_id,
            reservation_id: data.id,
            invoice_number: invoiceNumber,
            invoice_type: paymentCalc.depositAmount === paymentCalc.totalAmount ? 'reservation' : 'deposit',
            amount: paymentCalc.depositAmount,
            tax_amount: 0, // Can be calculated based on hotel settings
            service_charge: 0, // Can be calculated based on hotel settings
            total_amount: paymentCalc.depositAmount,
            status: 'draft',
            due_date: paymentDueDate?.toISOString().split('T')[0],
            sent_to_email: reservationData.guest_email
          });

        // Create payment reminder if needed
        if (paymentCalc.balanceDue > 0 && paymentDueDate) {
          const reminderEvent = {
            event_type: 'payment_reminder',
            event_source: 'reservation',
            source_id: data.id,
            template_data: {
              guest_name: reservationData.guest_name,
              amount_due: paymentCalc.balanceDue,
              due_date: paymentDueDate.toISOString().split('T')[0]
            },
            recipients: [
              {
                type: 'guest',
                email: reservationData.guest_email,
                phone: reservationData.guest_phone
              }
            ],
            channels: ['sms', 'email'],
            priority: 'medium'
          };

          // Schedule payment reminder 24 hours before due date
          const reminderTime = new Date(paymentDueDate);
          reminderTime.setHours(reminderTime.getHours() - 24);

          await supabase
            .from('notification_events')
            .insert({
              tenant_id: user.user_metadata?.tenant_id,
              ...reminderEvent,
              status: 'pending',
              scheduled_at: reminderTime.toISOString(),
              metadata: { invoice_number: invoiceNumber }
            });
        }
      }

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
          total_amount: paymentCalc.totalAmount,
          deposit_amount: paymentCalc.depositAmount,
          balance_due: paymentCalc.balanceDue,
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

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Reservation created successfully"
      });
    },
    onError: (error) => {
      console.error('Enhanced reservation creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create reservation",
        variant: "destructive"
      });
    }
  });
};

// Hook to create group reservation
export const useCreateGroupReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { calculatePayment } = usePaymentCalculator();

  return useMutation({
    mutationFn: async (groupData: GroupReservationData) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get default payment policy
      const { data: paymentPolicy } = await supabase
        .from('payment_policies')
        .select('*')
        .eq('tenant_id', user.user_metadata?.tenant_id)
        .eq('is_default', true)
        .single();

      // Generate group code
      const groupCode = `GRP-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      // Calculate total amounts
      let totalAmount = 0;
      const nights = Math.ceil(
        (new Date(groupData.check_out_date).getTime() - new Date(groupData.check_in_date).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      // Get room types and rates
      for (const guest of groupData.guests) {
        const { data: roomType } = await supabase
          .from('room_types')
          .select('base_rate')
          .eq('id', guest.room_type_id)
          .single();
        
        if (roomType) {
          totalAmount += roomType.base_rate * nights;
        }
      }

      const paymentCalc = paymentPolicy 
        ? calculatePayment(totalAmount, paymentPolicy as any, 'deposit')
        : { totalAmount, depositAmount: 0, balanceDue: totalAmount };

      // Create group reservation
      const { data: groupReservation, error: groupError } = await supabase
        .from('group_reservations')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          group_name: groupData.group_name,
          organizer_name: groupData.organizer_name,
          organizer_email: groupData.organizer_email,
          organizer_phone: groupData.organizer_phone,
          check_in_date: groupData.check_in_date,
          check_out_date: groupData.check_out_date,
          total_rooms: groupData.guests.length,
          total_guests: groupData.guests.reduce((sum, g) => sum + g.adults + g.children, 0),
          payment_mode: groupData.payment_mode,
          special_requests: groupData.special_requests,
          group_code: groupCode,
          total_amount: totalAmount,
          deposit_amount: paymentCalc.depositAmount,
          balance_due: paymentCalc.balanceDue,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Create individual reservations for each guest
      for (const guest of groupData.guests) {
        const { data: roomType } = await supabase
          .from('room_types')
          .select('base_rate')
          .eq('id', guest.room_type_id)
          .single();

        // Find available room of selected type
        const { data: availableRooms } = await supabase
          .from('rooms')
          .select('id')
          .eq('room_type_id', guest.room_type_id)
          .eq('status', 'available')
          .limit(1);

        if (!availableRooms || availableRooms.length === 0) {
          throw new Error(`No available rooms for guest ${guest.name}`);
        }

        const guestTotalAmount = roomType ? roomType.base_rate * nights : 0;
        const guestPaymentCalc = paymentPolicy 
          ? calculatePayment(guestTotalAmount, paymentPolicy as any, 
              groupData.payment_mode === 'split_individual' ? 'deposit' : 'none')
          : { totalAmount: guestTotalAmount, depositAmount: 0, balanceDue: guestTotalAmount, paymentStatus: 'pending' };

        const reservationNumber = `RES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        await supabase
          .from('reservations')
          .insert({
            tenant_id: user.user_metadata?.tenant_id,
            guest_name: guest.name,
            guest_email: guest.email,
            guest_phone: guest.phone,
            room_id: availableRooms[0].id,
            check_in_date: groupData.check_in_date,
            check_out_date: groupData.check_out_date,
            adults: guest.adults,
            children: guest.children,
            room_rate: roomType?.base_rate || 0,
            total_amount: guestTotalAmount,
            reservation_number: reservationNumber,
            status: 'confirmed',
            payment_policy_id: paymentPolicy?.id,
            payment_status: guestPaymentCalc.paymentStatus,
            deposit_amount: guestPaymentCalc.depositAmount,
            balance_due: guestPaymentCalc.balanceDue,
            group_reservation_id: groupReservation.id
          });
      }

      return groupReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['group-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Group booking created successfully"
      });
    },
    onError: (error) => {
      console.error('Group reservation creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create group booking",
        variant: "destructive"
      });
    }
  });
};

// Hook to fetch reservation invoices
export const useReservationInvoices = (reservationId?: string) => {
  return useQuery({
    queryKey: ['reservation-invoices', reservationId],
    queryFn: async () => {
      let query = supabase
        .from('reservation_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (reservationId) {
        query = query.eq('reservation_id', reservationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReservationInvoice[];
    },
    enabled: !!reservationId
  });
};

// Hook to send reservation confirmation
export const useSendReservationConfirmation = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reservationId, type }: { reservationId: string; type: 'confirmation' | 'invoice' | 'reminder' }) => {
      const { data, error } = await supabase.functions.invoke('send-reservation-email', {
        body: { reservationId, type }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully"
      });
    },
    onError: (error) => {
      console.error('Email sending error:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      });
    }
  });
};