import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateProcessRequest {
  template_name: string;
  event_type: string;
  tenant_id: string;
  variables: Record<string, any>;
  to: string;
  send_sms?: boolean;
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

    const { 
      template_name, 
      event_type, 
      tenant_id, 
      variables, 
      to, 
      send_sms = true 
    }: TemplateProcessRequest = await req.json();

    // First, try to get tenant-specific template
    let { data: template } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('event_type', event_type)
      .eq('is_active', true)
      .single();

    // If no tenant template, get global template
    if (!template) {
      const { data: globalTemplate } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('event_type', event_type)
        .eq('is_global', true)
        .eq('is_active', true)
        .single();

      template = globalTemplate;
    }

    if (!template) {
      throw new Error(`No template found for event type: ${event_type}`);
    }

    // Process template variables
    let processedMessage = template.message_template;
    const templateVariables = template.variables || [];

    // Replace placeholders with actual values
    for (const variable of templateVariables) {
      const placeholder = `{${variable}}`;
      const value = variables[variable] || `[${variable}]`;
      processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
    }

    // Check if SMS notification is enabled for this event type
    if (send_sms) {
      const { data: notificationSetting } = await supabase
        .from('sms_notifications_settings')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('event_type', event_type)
        .single();

      const isEnabled = notificationSetting?.is_enabled !== false; // Default to true if not set

      if (isEnabled) {
        // Check if tenant has sufficient SMS credits
        const { data: credits } = await supabase
          .from('sms_credits')
          .select('balance')
          .eq('tenant_id', tenant_id)
          .single();

        if (!credits || credits.balance < 1) {
          console.warn(`Insufficient SMS credits for tenant ${tenant_id}`);
          
          return new Response(
            JSON.stringify({ 
              success: false,
              message: processedMessage,
              template_id: template.id,
              error: 'Insufficient SMS credits'
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Send SMS via router with failover
        const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sms-router`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            message: processedMessage,
            tenant_id,
            template_id: template.id,
            event_type
          })
        });

        const smsResult = await smsResponse.json();

        return new Response(
          JSON.stringify({
            success: smsResult.success,
            message: processedMessage,
            template_id: template.id,
            template_name: template.template_name,
            sms_result: smsResult
          }),
          {
            status: smsResult.success ? 200 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Return processed message without sending SMS
    return new Response(
      JSON.stringify({
        success: true,
        message: processedMessage,
        template_id: template.id,
        template_name: template.template_name,
        sms_sent: false
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('SMS Template Processor Error:', error);
    
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