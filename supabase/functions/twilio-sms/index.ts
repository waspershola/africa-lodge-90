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

    // Get Twilio provider config
    const { data: provider } = await supabase
      .from('sms_providers')
      .select('*')
      .eq('provider_type', 'twilio')
      .eq('is_enabled', true)
      .single();

    if (!provider) {
      throw new Error('Twilio provider not configured or enabled');
    }

    const accountSid = provider.api_key || Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = provider.api_secret || Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = provider.sender_id || Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Create basic auth header
    const credentials = btoa(`${accountSid}:${authToken}`);

    // Send SMS via Twilio API
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message
      })
    });

    const result = await response.json();
    
    const success = response.status === 201;
    const errorMessage = success ? null : result.message;

    // Check SMS credits before logging
    const { data: credits } = await supabase
      .from('sms_credits')
      .select('balance')
      .eq('tenant_id', tenant_id)
      .single();

    const creditsUsed = 1; // Twilio typically charges per SMS

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
        message_id: result.sid,
        status: result.status,
        error_code: result.error_code
      }),
      {
        status: success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Twilio SMS Error:', error);
    
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