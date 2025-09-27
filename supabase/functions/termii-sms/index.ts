import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  sender_id?: string;
  message_type?: 'plain' | 'whatsapp';
  tenant_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, sender_id = "HotelPMS", message_type = "plain", tenant_id }: SMSRequest = await req.json();

    console.log(`Sending SMS via Termii to ${to} for tenant ${tenant_id}`);

    const termiiApiKey = Deno.env.get('TERMII_API_KEY');
    if (!termiiApiKey) {
      throw new Error('Termii API key not configured');
    }

    // Send SMS via Termii API
    const termiiResponse = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        from: sender_id,
        sms: message,
        type: message_type,
        api_key: termiiApiKey,
        channel: 'generic',
      }),
    });

    const termiiResult = await termiiResponse.json();
    
    if (!termiiResponse.ok) {
      console.error('Termii API error:', termiiResult);
      throw new Error(`Termii API error: ${termiiResult.message || 'Unknown error'}`);
    }

    console.log('SMS sent successfully via Termii:', termiiResult);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: termiiResult.message_id,
        status: termiiResult.status,
        provider: 'termii'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in termii-sms function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);