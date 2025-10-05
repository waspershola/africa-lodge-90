import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('[Escalation] Starting notification escalation check...');

    // Call the escalation function
    const { error: escalationError } = await supabaseClient
      .rpc('escalate_unacknowledged_notifications');

    if (escalationError) {
      console.error('[Escalation] Error calling escalation function:', escalationError);
      throw escalationError;
    }

    // Get escalated notifications to send additional alerts
    const { data: escalated, error: fetchError } = await supabaseClient
      .from('staff_notifications')
      .select('*')
      .eq('status', 'escalated')
      .is('metadata->escalation_notified', null);

    if (fetchError) {
      console.error('[Escalation] Error fetching escalated notifications:', fetchError);
      throw fetchError;
    }

    console.log(`[Escalation] Found ${escalated?.length || 0} newly escalated notifications`);

    // Mark as notified and optionally send additional alerts (email/SMS)
    if (escalated && escalated.length > 0) {
      for (const notification of escalated) {
        // Update metadata to mark as notified
        await supabaseClient
          .from('staff_notifications')
          .update({
            metadata: {
              ...notification.metadata,
              escalation_notified: true,
              escalation_notified_at: new Date().toISOString()
            }
          })
          .eq('id', notification.id);

        // Here you could add logic to send email/SMS to managers
        console.log(`[Escalation] Escalated notification ${notification.id}: ${notification.title}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        escalated_count: escalated?.length || 0,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Escalation] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
