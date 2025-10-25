// @ts-nocheck
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to schedule subscription renewal notifications
export const useScheduleSubscriptionRenewal = () => {
  return useMutation({
    mutationFn: async ({
      tenantId,
      subscriptionEndDate,
      planName,
      userEmails
    }: {
      tenantId: string;
      subscriptionEndDate: string;
      planName: string;
      userEmails: string[];
    }) => {
      // Schedule multiple reminders
      const reminders = [
        { days: 7, type: 'week_before' },
        { days: 3, type: 'three_days' },
        { days: 1, type: 'day_before' },
        { days: 0, type: 'day_of' }
      ];

      const events = [];

      for (const reminder of reminders) {
        const reminderDate = new Date(subscriptionEndDate);
        reminderDate.setDate(reminderDate.getDate() - reminder.days);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM

        const notificationEvent = {
          event_type: 'subscription_renewal',
          event_source: 'system',
          source_id: `subscription-${tenantId}`,
          template_data: {
            plan_name: planName,
            expiry_date: subscriptionEndDate,
            reminder_type: reminder.type,
            days_remaining: reminder.days
          },
          recipients: userEmails.map(email => ({
            type: 'staff',
            email: email,
            role: 'OWNER'
          })),
          channels: ['email', 'sms'],
          priority: reminder.days <= 1 ? 'high' : 'medium'
        };

        const { data, error } = await supabase
          .from('notification_events')
          .insert({
            tenant_id: tenantId,
            ...notificationEvent,
            status: 'pending',
            scheduled_at: reminderDate.toISOString(),
            metadata: { reminder_type: reminder.type }
          })
          .select()
          .single();

        if (error) throw error;
        events.push(data);
      }

      return events;
    }
  });
};

// Hook to create low credit alerts
export const useCreateLowCreditAlert = () => {
  return useMutation({
    mutationFn: async ({
      tenantId,
      currentBalance,
      threshold
    }: {
      tenantId: string;
      currentBalance: number;
      threshold: number;
    }) => {
      const notificationEvent = {
        event_type: 'low_sms_credits',
        event_source: 'system',
        source_id: `credits-${tenantId}`,
        template_data: {
          current_balance: currentBalance,
          threshold: threshold,
          percentage_remaining: (currentBalance / threshold) * 100
        },
        recipients: [
          {
            type: 'staff',
            role: 'OWNER'
          },
          {
            type: 'staff',
            role: 'MANAGER'
          }
        ],
        channels: ['email', 'sms'],
        priority: currentBalance <= (threshold * 0.1) ? 'high' : 'medium'
      };

      const { data, error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: tenantId,
          ...notificationEvent,
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          metadata: { alert_type: 'low_credits' }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });
};