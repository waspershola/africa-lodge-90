import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to schedule pre-arrival reminders
export const useSchedulePreArrivalReminder = () => {
  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get reservation details
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (resError) throw resError;

      // Schedule reminder 1 day before check-in
      const checkInDate = new Date(reservation.check_in_date);
      const reminderDate = new Date(checkInDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(10, 0, 0, 0); // 10 AM the day before

      const notificationEvent = {
        event_type: 'pre_arrival_reminder',
        event_source: 'reservation',
        source_id: reservationId,
        template_data: {
          guest_name: reservation.guest_name,
          check_in_date: reservation.check_in_date,
          reservation_number: reservation.reservation_number,
          check_in_time: '14:00'
        },
        recipients: [
          {
            type: 'guest',
            email: reservation.guest_email,
            phone: reservation.guest_phone
          }
        ],
        channels: ['email', 'sms'],
        priority: 'medium'
      };

      const { data, error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          ...notificationEvent,
          status: 'pending',
          scheduled_at: reminderDate.toISOString(),
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
};

// Hook to schedule checkout reminders
export const useScheduleCheckoutReminder = () => {
  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get reservation details
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (resError) throw resError;

      // Schedule reminder on checkout day at 9 AM
      const checkOutDate = new Date(reservation.check_out_date);
      checkOutDate.setHours(9, 0, 0, 0);

      const notificationEvent = {
        event_type: 'checkout_reminder',
        event_source: 'reservation',
        source_id: reservationId,
        template_data: {
          guest_name: reservation.guest_name,
          check_out_date: reservation.check_out_date,
          check_out_time: '12:00',
          total_amount: reservation.total_amount
        },
        recipients: [
          {
            type: 'guest',
            email: reservation.guest_email,
            phone: reservation.guest_phone
          }
        ],
        channels: ['email'],
        priority: 'low'
      };

      const { data, error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          ...notificationEvent,
          status: 'pending',
          scheduled_at: checkOutDate.toISOString(),
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
};

// Hook to trigger staff service alerts
export const useCreateServiceAlert = () => {
  return useMutation({
    mutationFn: async ({
      sourceId,
      sourceType,
      title,
      description,
      roomNumber,
      priority = 'medium',
      department
    }: {
      sourceId: string;
      sourceType: 'qr_order' | 'housekeeping' | 'maintenance';
      title: string;
      description: string;
      roomNumber?: string;
      priority?: 'low' | 'medium' | 'high';
      department: string;
    }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const notificationEvent = {
        event_type: 'service_request',
        event_source: sourceType,
        source_id: sourceId,
        template_data: {
          request_title: title,
          request_description: description,
          room_number: roomNumber,
          priority_level: priority,
          department: department
        },
        recipients: [
          {
            type: 'staff',
            department: department
          }
        ],
        channels: ['sms'],
        priority: priority
      };

      const { data, error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          ...notificationEvent,
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          metadata: { source_type: sourceType }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
};

// Hook to create manager daily summary
export const useScheduleManagerSummary = () => {
  return useMutation({
    mutationFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Schedule for next day at 8 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const notificationEvent = {
        event_type: 'manager_daily_summary',
        event_source: 'system',
        source_id: 'daily-summary',
        template_data: {
          summary_date: tomorrow.toISOString().split('T')[0]
        },
        recipients: [
          {
            type: 'manager',
            role: 'MANAGER'
          },
          {
            type: 'manager',
            role: 'OWNER'
          }
        ],
        channels: ['email'],
        priority: 'medium'
      };

      const { data, error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          ...notificationEvent,
          status: 'pending',
          scheduled_at: tomorrow.toISOString(),
          metadata: { recurring: 'daily' }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
};