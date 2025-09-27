import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  tenant_id: string;
  template_id?: string;
  event_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, message, tenant_id, template_id, event_type }: SMSRequest = await req.json();

    // Get Africa's Talking provider config
    const { data: provider } = await supabase
      .from('sms_providers')
      .select('*')
      .eq('provider_type', 'africastalking')
      .eq('is_enabled', true)
      .single();

    if (!provider) {
      throw new Error('Africa\'s Talking provider not configured or enabled');
    }

    const apiKey = provider.api_key || Deno.env.get('AFRICASTALKING_API_KEY');
    const username = provider.config?.username || Deno.env.get('AFRICASTALKING_USERNAME');

    if (!apiKey || !username) {
      throw new Error('Africa\'s Talking credentials not configured');
    }

    // Send SMS via Africa's Talking API
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        username: username,
        to: to,
        message: message,
        from: provider.sender_id || 'HOTEL'
      })
    });

    const result = await response.json();
    
    const success = result.SMSMessageData?.Recipients?.[0]?.status === 'Success';
    const errorMessage = success ? null : result.SMSMessageData?.Recipients?.[0]?.status;

    // Check SMS credits before logging
    const { data: credits } = await supabase
      .from('sms_credits')
      .select('balance')
      .eq('tenant_id', tenant_id)
      .single();

    const creditsUsed = 1; // Africa's Talking typically charges per SMS

    // Consume credits if available
    if (credits && credits.balance >= creditsUsed) {
      await supabase.rpc('consume_sms_credits', {
        p_tenant_id: tenant_id,
        p_credits: creditsUsed,
        p_purpose: event_type || 'manual_sms',
        p_recipient_phone: to,
        p_message_preview: message.substring(0, 100)
      });
    }

    // Log SMS attempt
    await supabase.from('sms_logs').insert({
      tenant_id,
      provider_id: provider.id,
      template_id,
      event_type,
      credits_used: creditsUsed,
      source_type: 'system',
      purpose: event_type || 'manual_sms',
      recipient_phone: to,
      message_preview: message.substring(0, 100),
      status: success ? 'sent' : 'failed',
      delivery_status: success ? 'sent' : 'failed',
      error_code: errorMessage,
      cost_per_credit: provider.cost_per_sms || 0,
      sent_at: success ? new Date().toISOString() : null
    });

    // Update provider health status
    await supabase
      .from('sms_providers')
      .update({ 
        last_health_check: new Date().toISOString(),
        health_status: success ? 'healthy' : 'degraded'
      })
      .eq('id', provider.id);

    return new Response(
      JSON.stringify({ 
        success,
        message_id: result.SMSMessageData?.Recipients?.[0]?.messageId,
        status: result.SMSMessageData?.Recipients?.[0]?.status,
        cost: result.SMSMessageData?.Recipients?.[0]?.cost
      }),
      {
        status: success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Africa\'s Talking SMS Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});