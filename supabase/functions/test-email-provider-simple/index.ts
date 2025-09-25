import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SesEmailService } from '../_shared/email-service/providers/ses-service.ts';
import { MailerSendEmailService } from '../_shared/email-service/providers/mailersend-service.ts';
import { ResendEmailService } from '../_shared/email-service/providers/resend-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider_type, config, test_email } = await req.json();
    console.log(`Testing ${provider_type} with email: ${test_email}`);

    let service;
    
    switch (provider_type) {
      case 'ses':
        console.log('Creating SES service with config:', {
          region: config.region,
          hasAccessKey: !!config.access_key_id,
          hasSecretKey: !!config.secret_access_key
        });
        service = new SesEmailService({
          region: config.region || 'eu-north-1', // Default to Stockholm
          access_key_id: config.access_key_id,
          secret_access_key: config.secret_access_key,
          verified_domains: config.verified_domains || []
        });
        break;
        
      case 'mailersend':
        console.log('Creating MailerSend service with API key:', !!config.api_key);
        service = new MailerSendEmailService({
          api_key: config.api_key,
          verified_domains: config.verified_domains || []
        });
        break;
        
      case 'resend':
        console.log('Creating Resend service with API key:', !!config.api_key);
        service = new ResendEmailService({
          api_key: config.api_key,
          verified_domains: config.verified_domains || []
        });
        break;
        
      default:
        throw new Error(`Unknown provider: ${provider_type}`);
    }

    console.log(`Sending test email via ${provider_type}...`);
    
    const result = await service.sendEmail({
      to: [test_email],
      subject: `Direct Test - ${provider_type.toUpperCase()}`,
      html: `<h1>Direct Test Email</h1><p>This is a direct test of the ${provider_type} provider.</p><p>Sent at: ${new Date().toISOString()}</p>`,
      from: provider_type === 'resend' ? 'onboarding@resend.dev' : 'noreply@example.com',
      fromName: 'Direct Test'
    });

    console.log(`${provider_type} result:`, result);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Direct test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});