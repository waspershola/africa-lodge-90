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
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting test email provider function...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated and is super admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Verifying authentication...');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication error:', authError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Checking user permissions...');
    // Check if user is super admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'SUPER_ADMIN') {
      console.log('Permission error:', userError, userData?.role);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Insufficient permissions' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Parsing request body...');
    const requestBody = await req.text();
    console.log('Request body:', requestBody);
    
    const { provider_type, config, test_email }: TestEmailRequest = JSON.parse(requestBody);
    console.log('Parsed test email request:', { provider_type, test_email, configKeys: Object.keys(config || {}) });

    if (!provider_type || !config || !test_email) {
      console.log('Missing required parameters:', { provider_type: !!provider_type, config: !!config, test_email: !!test_email });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Creating test config for provider:', provider_type);
    
    // Get actual API keys from environment variables for security
    let actualApiKey = '';
    if (provider_type === 'resend') {
      actualApiKey = Deno.env.get('RESEND_API_KEY') || config.api_key || '';
    } else {
      actualApiKey = config.api_key || '';
    }
    
    console.log('Using API key source:', {
      provider: provider_type,
      hasEnvKey: provider_type === 'resend' ? !!Deno.env.get('RESEND_API_KEY') : 'N/A',
      hasConfigKey: !!config.api_key,
      finalKeyExists: !!actualApiKey
    });
    
    // Create a test EmailProviderConfig with proper credentials
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
          api_key: provider_type === 'mailersend' ? actualApiKey : '',
          verified_domains: config.verified_domains || []
        },
        resend: {
          enabled: provider_type === 'resend',
          api_key: provider_type === 'resend' ? actualApiKey : '',
          verified_domains: config.verified_domains || []
        }
      }
    };

    console.log('Test config created:', {
      default_provider: testConfig.default_provider,
      enabled: testConfig.providers[provider_type].enabled,
      hasCredentials: provider_type === 'ses' 
        ? !!(testConfig.providers.ses.access_key_id && testConfig.providers.ses.secret_access_key)
        : !!(testConfig.providers[provider_type as 'mailersend' | 'resend'].api_key)
    });

    console.log('Creating email factory...');
    const emailFactory = new EmailServiceFactory();
    
    console.log('Sending test email...');
    const result = await emailFactory.sendEmailWithFallback(
      crypto.randomUUID(), // Generate a valid UUID for testing
      testConfig,
      {
        to: [test_email],
        subject: `Test Email - ${provider_type.toUpperCase()} Provider`,
        html: generateTestEmailHTML(provider_type),
        from: provider_type === 'resend' ? 'onboarding@resend.dev' : 'noreply@example.com',
        fromName: 'Hotel Management System'
      },
      'provider_test'
    );

    console.log('Test email result:', result);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : (result.error?.includes('All email providers failed') ? 500 : 400),
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Test email provider error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : String(error)
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