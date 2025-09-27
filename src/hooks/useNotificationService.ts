import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationEventData {
  event_type: string;
  event_source: string;
  source_id: string;
  template_data: Record<string, any>;
  recipients: Array<{
    type: 'guest' | 'staff' | 'manager';
    email?: string;
    phone?: string;
    role?: string;
    department?: string;
  }>;
  channels: string[];
  priority?: 'low' | 'medium' | 'high';
  scheduled_at?: string;
  metadata?: Record<string, any>;
}

// Hook to create notification events
export const useCreateNotificationEvent = () => {
  return useMutation({
    mutationFn: async (eventData: NotificationEventData) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          event_type: eventData.event_type,
          event_source: eventData.event_source,
          source_id: eventData.source_id,
          template_data: eventData.template_data,
          recipients: eventData.recipients,
          channels: eventData.channels,
          priority: eventData.priority || 'medium',
          scheduled_at: eventData.scheduled_at || new Date().toISOString(),
          metadata: eventData.metadata || {},
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
};

// Helper to create booking confirmation notification
export const createBookingConfirmationEvent = (
  reservationId: string,
  guestInfo: {
    name: string;
    email?: string;
    phone?: string;
  },
  hotelInfo: {
    name: string;
    front_desk_phone?: string;
  },
  reservationDetails: {
    room_number?: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    reservation_number: string;
  }
): NotificationEventData => ({
  event_type: 'booking_confirmed',
  event_source: 'reservation',
  source_id: reservationId,
  template_data: {
    guest_name: guestInfo.name,
    hotel_name: hotelInfo.name,
    reservation_number: reservationDetails.reservation_number,
    room_number: reservationDetails.room_number || 'TBA',
    check_in_date: reservationDetails.check_in_date,
    check_out_date: reservationDetails.check_out_date,
    total_amount: reservationDetails.total_amount,
    front_desk_phone: hotelInfo.front_desk_phone
  },
  recipients: [
    {
      type: 'guest',
      email: guestInfo.email,
      phone: guestInfo.phone
    },
    {
      type: 'staff',
      role: 'FRONT_DESK',
      phone: hotelInfo.front_desk_phone
    },
    {
      type: 'manager',
      role: 'MANAGER'
    }
  ],
  channels: ['sms', 'email'],
  priority: 'high'
});

// Helper to create payment reminder notification
export const createPaymentReminderEvent = (
  reservationId: string,
  guestInfo: {
    name: string;
    email?: string;
    phone?: string;
  },
  paymentInfo: {
    amount_due: number;
    due_date: string;
    payment_link?: string;
  },
  scheduledHours: number = 24
): NotificationEventData => {
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + scheduledHours);

  return {
    event_type: 'payment_reminder',
    event_source: 'reservation',
    source_id: reservationId,
    template_data: {
      guest_name: guestInfo.name,
      amount_due: paymentInfo.amount_due,
      due_date: paymentInfo.due_date,
      payment_link: paymentInfo.payment_link
    },
    recipients: [
      {
        type: 'guest',
        email: guestInfo.email,
        phone: guestInfo.phone
      }
    ],
    channels: ['sms', 'email'],
    priority: 'medium',
    scheduled_at: scheduledAt.toISOString()
  };
};

// Helper to create cancellation notification
export const createCancellationEvent = (
  reservationId: string,
  guestInfo: {
    name: string;
    email?: string;
    phone?: string;
  },
  reservationDetails: {
    reservation_number: string;
    check_in_date: string;
    refund_amount?: number;
  },
  reason: string = 'Guest cancellation'
): NotificationEventData => ({
  event_type: 'reservation_cancelled',
  event_source: 'reservation',
  source_id: reservationId,
  template_data: {
    guest_name: guestInfo.name,
    reservation_number: reservationDetails.reservation_number,
    check_in_date: reservationDetails.check_in_date,
    refund_amount: reservationDetails.refund_amount,
    cancellation_reason: reason
  },
  recipients: [
    {
      type: 'guest',
      email: guestInfo.email,
      phone: guestInfo.phone
    },
    {
      type: 'staff',
      role: 'FRONT_DESK'
    }
  ],
  channels: ['sms', 'email'],
  priority: 'medium'
});

// Helper to create staff service alert
export const createServiceAlertEvent = (
  sourceId: string,
  sourceType: 'qr_order' | 'housekeeping' | 'maintenance',
  alertInfo: {
    title: string;
    description: string;
    room_number?: string;
    priority: 'low' | 'medium' | 'high';
    department: string;
  }
): NotificationEventData => ({
  event_type: 'service_request',
  event_source: sourceType,
  source_id: sourceId,
  template_data: {
    request_title: alertInfo.title,
    request_description: alertInfo.description,
    room_number: alertInfo.room_number,
    priority_level: alertInfo.priority
  },
  recipients: [
    {
      type: 'staff',
      department: alertInfo.department
    }
  ],
  channels: ['sms'],
  priority: alertInfo.priority
});