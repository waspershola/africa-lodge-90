import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendRequestSMSRequest {
  request_id: string;
  tenant_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id, tenant_id }: SendRequestSMSRequest = await req.json();

    console.log(`Processing SMS for request ${request_id}, tenant ${tenant_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('qr_requests')
      .select('*, hotels(name)')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      throw new Error('Request not found');
    }

    // Check if SMS is enabled and phone is provided
    if (!request.sms_enabled || !request.guest_phone) {
      console.log('SMS not enabled or phone not provided');
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true,
          reason: 'SMS not enabled or phone missing' 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if SMS already sent
    if (request.sms_sent) {
      console.log('SMS already sent for this request');
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true,
          reason: 'SMS already sent' 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Process SMS template
    const { data: processedMessage, error: templateError } = await supabase.functions.invoke(
      'sms-template-processor',
      {
        body: {
          tenant_id,
          event_type: 'request_received',
          variables: {
            hotel: request.hotels?.name || 'Hotel',
            guest_name: request.guest_name || 'Guest',
            request_type: request.request_type,
            tracking_number: request.tracking_number || 'N/A',
          },
          send_sms: false,
        },
      }
    );

    if (templateError) {
      console.error('Template processing error:', templateError);
      throw new Error('Failed to process template');
    }

    // Send SMS via router
    const { data: smsResult, error: smsError } = await supabase.functions.invoke(
      'sms-router',
      {
        body: {
          to: request.guest_phone,
          message: processedMessage.processed_message,
          tenant_id,
          template_id: processedMessage.template_id,
          event_type: 'request_received',
        },
      }
    );

    if (smsError) {
      console.error('SMS sending error:', smsError);
      throw new Error('Failed to send SMS');
    }

    // Update request with SMS sent status
    await supabase
      .from('qr_requests')
      .update({
        sms_sent: true,
        sms_sent_at: new Date().toISOString(),
      })
      .eq('id', request_id);

    console.log('SMS sent successfully:', smsResult);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: smsResult.message_id,
        provider: smsResult.provider,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-request-sms function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
