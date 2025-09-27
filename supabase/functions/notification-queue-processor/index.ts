import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_source: string;
  source_id?: string;
  priority: string;
  recipients: any[];
  template_data: any;
  channels: string[];
  scheduled_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Notification queue processor started');

    // Get pending notification events
    const { data: events, error: fetchError } = await supabase
      .from('notification_events')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching notification events:', fetchError);
      throw fetchError;
    }

    console.log(`Processing ${events?.length || 0} notification events`);

    for (const event of events || []) {
      try {
        // Mark as processing
        await supabase
          .from('notification_events')
          .update({ status: 'processing' })
          .eq('id', event.id);

        console.log(`Processing event ${event.id}: ${event.event_type}`);

        // Get notification rules for this event type and tenant
        const { data: rules } = await supabase
          .from('notification_rules')
          .select('*')
          .eq('tenant_id', event.tenant_id)
          .eq('event_type', event.event_type)
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (!rules || rules.length === 0) {
          console.log(`No notification rules found for ${event.event_type}`);
          await supabase
            .from('notification_events')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString(),
              delivery_results: { message: 'No applicable rules found' }
            })
            .eq('id', event.id);
          continue;
        }

        // Process each rule
        const deliveryResults: any = {};
        
        for (const rule of rules) {
          const routingConfig = rule.routing_config as any;
          
          for (const [recipientType, config] of Object.entries(routingConfig)) {
            const { channels, template } = config as any;
            
            console.log(`Processing ${recipientType} via ${channels.join(', ')}`);
            
            // Process each channel
            for (const channel of channels) {
              try {
                let result;
                
                switch (channel) {
                  case 'sms':
                    result = await processSMSNotification(supabase, event, recipientType, template);
                    break;
                  case 'email':
                    result = await processEmailNotification(supabase, event, recipientType, template);
                    break;
                  case 'in_app':
                    result = await processInAppNotification(supabase, event, recipientType, template);
                    break;
                  case 'push':
                    result = await processPushNotification(supabase, event, recipientType, template);
                    break;
                  default:
                    console.log(`Unknown channel: ${channel}`);
                    continue;
                }
                
                deliveryResults[`${recipientType}_${channel}`] = result;
                
              } catch (channelError) {
                console.error(`Error processing ${channel} for ${recipientType}:`, channelError);
                deliveryResults[`${recipientType}_${channel}`] = {
                  success: false,
                  error: channelError instanceof Error ? channelError.message : String(channelError)
                };
              }
            }
          }
        }

        // Mark as completed
        await supabase
          .from('notification_events')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            delivery_results: deliveryResults
          })
          .eq('id', event.id);

        console.log(`Event ${event.id} processed successfully`);

      } catch (eventError) {
        console.error(`Error processing event ${event.id}:`, eventError);
        
        // Increment retry count
        const newRetryCount = (event.retry_count || 0) + 1;
        const status = newRetryCount >= (event.max_retries || 3) ? 'failed' : 'pending';
        
        await supabase
          .from('notification_events')
          .update({
            status,
            retry_count: newRetryCount,
            delivery_results: { error: eventError instanceof Error ? eventError.message : String(eventError) }
          })
          .eq('id', event.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: events?.length || 0,
        message: 'Notification queue processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notification queue processor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processSMSNotification(supabase: any, event: NotificationEvent, recipientType: string, template: string) {
  console.log(`Processing SMS notification for ${recipientType} using template ${template}`);
  
  try {
    // Get hotel settings for SMS configuration
    const { data: hotelSettings } = await supabase
      .from('hotel_settings')
      .select('front_desk_phone, notification_preferences')
      .eq('tenant_id', event.tenant_id)
      .single();

    let recipientPhone = '';
    
    // Determine recipient phone based on type
    switch (recipientType) {
      case 'guest':
        recipientPhone = event.template_data?.guest_phone || '';
        break;
      case 'front_desk':
        recipientPhone = hotelSettings?.front_desk_phone || '';
        break;
      case 'housekeeping_staff':
        // Get housekeeping staff phone from users table
        const { data: staff } = await supabase
          .from('users')
          .select('phone')
          .eq('tenant_id', event.tenant_id)
          .eq('role', 'HOUSEKEEPING')
          .eq('is_active', true)
          .limit(1);
        recipientPhone = staff?.[0]?.phone || '';
        break;
      default:
        console.log(`Unknown recipient type: ${recipientType}`);
        return { success: false, error: 'Unknown recipient type' };
    }

    if (!recipientPhone) {
      return { success: false, error: 'No phone number available for recipient' };
    }

    // Call SMS template processor
    const { data: smsResult, error: smsError } = await supabase.functions.invoke('sms-template-processor', {
      body: {
        template_name: template,
        event_type: event.event_type,
        tenant_id: event.tenant_id,
        variables: event.template_data,
        to: recipientPhone,
        send_sms: true
      }
    });

    if (smsError) {
      throw smsError;
    }

    return {
      success: smsResult?.success || false,
      phone: recipientPhone,
      template,
      result: smsResult
    };

  } catch (error) {
    console.error('SMS processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function processEmailNotification(supabase: any, event: NotificationEvent, recipientType: string, template: string) {
  console.log(`Processing email notification for ${recipientType} using template ${template}`);
  
  try {
    let recipientEmail = '';
    
    // Determine recipient email based on type
    switch (recipientType) {
      case 'guest':
        recipientEmail = event.template_data?.guest_email || '';
        break;
      case 'manager':
        // Get manager email from users table
        const { data: managers } = await supabase
          .from('users')
          .select('email')
          .eq('tenant_id', event.tenant_id)
          .eq('role', 'MANAGER')
          .eq('is_active', true)
          .limit(1);
        recipientEmail = managers?.[0]?.email || '';
        break;
      default:
        console.log(`Unknown email recipient type: ${recipientType}`);
        return { success: false, error: 'Unknown recipient type' };
    }

    if (!recipientEmail) {
      return { success: false, error: 'No email address available for recipient' };
    }

    // Call email function (to be implemented)
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-reservation-email', {
      body: {
        type: template,
        recipientEmail: recipientEmail,
        templateData: event.template_data,
        hotelName: event.template_data?.hotel_name || 'Hotel'
      }
    });

    if (emailError) {
      throw emailError;
    }

    return {
      success: emailResult?.success !== false,
      email: recipientEmail,
      template,
      result: emailResult
    };

  } catch (error) {
    console.error('Email processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function processInAppNotification(supabase: any, event: NotificationEvent, recipientType: string, template: string) {
  console.log(`Processing in-app notification for ${recipientType} using template ${template}`);
  
  try {
    // Create staff alert for in-app notification
    const { data: alert, error: alertError } = await supabase
      .from('staff_alerts')
      .insert({
        tenant_id: event.tenant_id,
        alert_type: event.event_type,
        title: generateAlertTitle(event.event_type, event.template_data),
        message: generateAlertMessage(template, event.template_data),
        priority: event.priority,
        channels: ['in_app'],
        source_type: event.event_source,
        source_id: event.source_id,
        delivery_status: { in_app: { delivered: true, timestamp: new Date().toISOString() } }
      })
      .select()
      .single();

    if (alertError) {
      throw alertError;
    }

    return {
      success: true,
      alert_id: alert.id,
      template,
      result: 'In-app alert created successfully'
    };

  } catch (error) {
    console.error('In-app notification processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function processPushNotification(supabase: any, event: NotificationEvent, recipientType: string, template: string) {
  console.log(`Processing push notification for ${recipientType} using template ${template}`);
  
  // Push notifications would be implemented here
  // For now, just return success as placeholder
  return {
    success: true,
    template,
    result: 'Push notification queued (placeholder)'
  };
}

function generateAlertTitle(eventType: string, templateData: any): string {
  switch (eventType) {
    case 'reservation_created':
      return `New Reservation: ${templateData.guest_name || 'Guest'}`;
    case 'housekeeping_request':
      return `Cleaning Request: Room ${templateData.room_number || 'N/A'}`;
    case 'payment_reminder':
      return `Payment Reminder: ${templateData.reservation_number || 'N/A'}`;
    case 'outstanding_payment':
      return `Outstanding Payment: ${templateData.guest_name || 'Guest'}`;
    default:
      return `Staff Alert: ${eventType}`;
  }
}

function generateAlertMessage(template: string, templateData: any): string {
  switch (template) {
    case 'booking_received':
      return `New booking received for ${templateData.guest_name} from ${templateData.check_in_date} to ${templateData.check_out_date}`;
    case 'new_booking_alert':
      return `New booking: ${templateData.guest_name}, ${templateData.room_type}, Check-in: ${templateData.check_in_date}`;
    case 'cleaning_request':
      return `Room ${templateData.room_number} requires cleaning as requested by guest`;
    case 'payment_reminder':
      return `Payment reminder sent to guest for reservation ${templateData.reservation_number}`;
    case 'outstanding_balance':
      return `Guest ${templateData.guest_name} has outstanding balance of ${templateData.amount}`;
    default:
      return `Notification: ${template}`;
  }
}
