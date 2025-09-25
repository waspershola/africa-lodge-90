import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EmailServiceFactory } from '../_shared/email-service/email-service-factory.ts';
import { EmailProviderConfig } from '../_shared/email-service/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailRequest {
  provider_type: 'ses' | 'mailersend' | 'resend';
  config: Record<string, any>;
  test_email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated and is super admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is super admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Insufficient permissions' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { provider_type, config, test_email }: TestEmailRequest = await req.json();

    if (!provider_type || !config || !test_email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a test EmailProviderConfig
    const testConfig: EmailProviderConfig = {
      default_provider: provider_type,
      fallback_enabled: false,
      fallback_provider: provider_type,
      providers: {
        ses: {
          enabled: provider_type === 'ses',
          region: config.region || 'us-east-1',
          access_key_id: config.access_key_id || '',
          secret_access_key: config.secret_access_key || '',
          verified_domains: config.verified_domains || []
        },
        mailersend: {
          enabled: provider_type === 'mailersend',
          api_key: config.api_key || '',
          verified_domains: config.verified_domains || []
        },
        resend: {
          enabled: provider_type === 'resend',
          api_key: config.api_key || '',
          verified_domains: config.verified_domains || []
        }
      }
    };

    const emailFactory = new EmailServiceFactory();
    
    const result = await emailFactory.sendEmailWithFallback(
      crypto.randomUUID(), // Generate a valid UUID for testing
      testConfig,
      {
        to: [test_email],
        subject: `Test Email - ${provider_type.toUpperCase()} Provider`,
        html: generateTestEmailHTML(provider_type),
        from: 'noreply@example.com',
        fromName: 'Hotel Management System'
      },
      'provider_test'
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test email provider error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateTestEmailHTML(provider: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Provider Test</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Hotel Management System</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${provider.toUpperCase()} Provider Test</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2563eb; margin-top: 0;">✅ ${provider.toUpperCase()} Provider Working!</h2>
        <p>This is a test email to verify that your <strong>${provider.toUpperCase()}</strong> email provider is configured correctly.</p>
        <p>If you received this email, your ${provider} configuration is working properly and ready to send:</p>
        <ul>
          <li>Reservation confirmations</li>
          <li>Invoice notifications</li>
          <li>Payment reminders</li>
          <li>Group booking communications</li>
        </ul>
        
        <div style="background: #dcfce7; border: 1px solid #22c55e; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #15803d; font-weight: 500;">
            ✅ ${provider.toUpperCase()} Provider Status: <strong>Active & Ready</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
        <p>Test conducted at ${new Date().toLocaleString()}</p>
        <p>Powered by Hotel Management System</p>
      </div>
    </body>
    </html>
  `;
}