import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting auto-expiry process...');

    // Call the auto-expire function
    const { error: expireError } = await supabase.rpc('auto_expire_reservations');
    
    if (expireError) {
      console.error('Error auto-expiring reservations:', expireError);
      throw expireError;
    }

    // Get expired reservations for notification
    const { data: expiredReservations, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        guest_name,
        guest_phone,
        guest_email,
        status,
        check_in_date,
        tenants:tenant_id (
          tenant_id,
          hotel_name,
          email_settings
        )
      `)
      .in('status', ['no_show', 'expired'])
      .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Last 10 minutes

    if (fetchError) {
      console.error('Error fetching expired reservations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredReservations?.length || 0} recently expired reservations`);

    // Send notifications for expired reservations
    const notifications = [];
    for (const reservation of expiredReservations || []) {
      try {
        // Check if SMS credits are available
        const { data: smsCredits } = await supabase
          .from('sms_credits')
          .select('balance')
          .eq('tenant_id', reservation.tenant_id)
          .single();

        // Send SMS notification if guest has phone and credits available
        if (reservation.guest_phone && smsCredits?.balance > 0) {
          const message = reservation.status === 'no_show' 
            ? `Hi ${reservation.guest_name}, we noticed you didn't check in for reservation ${reservation.reservation_number}. Please contact us if you still need assistance.`
            : `Hi ${reservation.guest_name}, your reservation ${reservation.reservation_number} has expired due to payment timeout. Please contact us to rebook.`;

          // Consume SMS credits
          const { error: consumeError } = await supabase.rpc(
            'consume_sms_credits',
            {
              p_tenant_id: reservation.tenant_id,
              p_credits: 1,
              p_purpose: `auto_${reservation.status}_notification`,
              p_recipient_phone: reservation.guest_phone,
              p_message_preview: message.substring(0, 100)
            }
          );

          if (!consumeError) {
            notifications.push({
              type: 'sms',
              recipient: reservation.guest_phone,
              message,
              reservation_id: reservation.id
            });
          }
        }

        // Send email notification to hotel staff
        notifications.push({
          type: 'staff_email',
          recipient: 'staff',
          subject: `${reservation.status === 'no_show' ? 'No-Show' : 'Expired'} Reservation: ${reservation.reservation_number}`,
          message: `Reservation ${reservation.reservation_number} for ${reservation.guest_name} has been marked as ${reservation.status}. Room inventory has been released.`,
          reservation_id: reservation.id
        });
      } catch (notificationError) {
        console.error(`Error processing notification for reservation ${reservation.id}:`, notificationError);
      }
    }

    // Update room type counts for affected tenants
    const { data: affectedTenants } = await supabase
      .from('reservations')
      .select('tenant_id, room_type_id')
      .in('status', ['no_show', 'expired'])
      .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .not('room_type_id', 'is', null);

    for (const tenant of affectedTenants || []) {
      await supabase.rpc('update_room_type_counts', {
        p_tenant_id: tenant.tenant_id,
        p_room_type_id: tenant.room_type_id
      });
    }

    const result = {
      success: true,
      processed_at: new Date().toISOString(),
      expired_count: expiredReservations?.length || 0,
      notifications_sent: notifications.length,
      notifications
    };

    console.log('Auto-expiry process completed:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in auto-expire function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});