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
  priority?: 'high' | 'normal' | 'low';
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

    const smsRequest: SMSRequest = await req.json();

    // Get available providers in priority order
    const { data: providers } = await supabase
      .from('sms_providers')
      .select('*')
      .eq('is_enabled', true)
      .order('priority', { ascending: true });

    if (!providers || providers.length === 0) {
      throw new Error('No SMS providers are configured and enabled');
    }

    let lastError: string = '';
    let success = false;
    let result: any = null;

    // Try each provider in priority order
    for (const provider of providers) {
      try {
        console.log(`Attempting SMS via ${provider.name} (${provider.provider_type})`);

        let response: Response;

        switch (provider.provider_type) {
          case 'termii':
            response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/termii-sms`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(smsRequest)
            });
            break;

          case 'africastalking':
            response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/africastalking-sms`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(smsRequest)
            });
            break;

          case 'twilio':
            response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/twilio-sms`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(smsRequest)
            });
            break;

          default:
            console.log(`Unknown provider type: ${provider.provider_type}`);
            continue;
        }

        const providerResult = await response.json();

        if (response.ok && providerResult.success) {
          success = true;
          result = providerResult;
          
          // Update provider success rate
          await supabase
            .from('sms_providers')
            .update({ 
              health_status: 'healthy',
              last_health_check: new Date().toISOString()
            })
            .eq('id', provider.id);

          console.log(`SMS sent successfully via ${provider.name}`);
          break;
        } else {
          lastError = providerResult.error || 'Unknown error';
          console.log(`Failed to send via ${provider.name}: ${lastError}`);
          
          // Update provider health status
          await supabase
            .from('sms_providers')
            .update({ 
              health_status: 'degraded',
              last_health_check: new Date().toISOString()
            })
            .eq('id', provider.id);
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error with provider ${provider.name}:`, error);
        
        // Mark provider as down
        await supabase
          .from('sms_providers')
          .update({ 
            health_status: 'down',
            last_health_check: new Date().toISOString()
          })
          .eq('id', provider.id);
      }
    }

    if (!success) {
      // Log failed attempt
      await supabase.from('sms_logs').insert({
        tenant_id: smsRequest.tenant_id,
        template_id: smsRequest.template_id,
        event_type: smsRequest.event_type,
        credits_used: 0,
        source_type: 'system',
        purpose: smsRequest.event_type || 'manual_sms',
        recipient_phone: smsRequest.to,
        message_preview: smsRequest.message.substring(0, 100),
        status: 'failed',
        delivery_status: 'failed',
        error_code: lastError
      });

      throw new Error(`All SMS providers failed. Last error: ${lastError}`);
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('SMS Router Error:', error);
    
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