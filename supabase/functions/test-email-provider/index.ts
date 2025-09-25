import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailRequest {
  provider_type: 'ses' | 'mailersend' | 'resend';
  config: Record<string, any>;
  test_email: string;
}

// Simplified email sending function
async function sendTestEmail(provider: string, config: any, testEmail: string): Promise<{success: boolean, error?: string, messageId?: string}> {
  console.log(`Testing ${provider} with config keys:`, Object.keys(config));
  
  try {
    switch (provider) {
      case 'resend':
        return await sendWithResend(config, testEmail);
      case 'mailersend':
        return await sendWithMailerSend(config, testEmail);
      case 'ses':
        return await sendWithSES(config, testEmail);
      default:
        return { success: false, error: `Unsupported provider: ${provider}` };
    }
  } catch (error) {
    console.error(`${provider} test error:`, error);
    return { 
      success: false, 
      error: `${provider.toUpperCase()} Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function sendWithResend(config: any, testEmail: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY') || config.api_key;
  if (!apiKey) {
    return { success: false, error: 'Resend API key not found' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Hotel System <onboarding@resend.dev>',
      to: [testEmail],
      subject: 'Test Email - Resend Provider',
      html: generateTestEmailHTML('resend')
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: `Resend API error: ${data.message || 'Unknown error'}` };
  }
  
  return { success: true, messageId: data.id };
}

async function sendWithMailerSend(config: any, testEmail: string) {
  if (!config.api_key) {
    return { success: false, error: 'MailerSend API key not found' };
  }

  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: 'noreply@example.com', name: 'Hotel System' },
      to: [{ email: testEmail }],
      subject: 'Test Email - MailerSend Provider',
      html: generateTestEmailHTML('mailersend')
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: `MailerSend API error: ${data.message || 'Unknown error'}` };
  }
  
  return { success: true, messageId: data.id || 'unknown' };
}

async function sendWithSES(config: any, testEmail: string) {
  if (!config.access_key_id || !config.secret_access_key) {
    return { success: false, error: 'SES credentials not found' };
  }

  try {
    const { SESClient, SendEmailCommand } = await import('https://esm.sh/@aws-sdk/client-ses@3.896.0');
    
    const client = new SESClient({
      region: config.region || 'eu-north-1',
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key,
      },
    });

    const command = new SendEmailCommand({
      Source: 'Hotel System <noreply@example.com>',
      Destination: { ToAddresses: [testEmail] },
      Message: {
        Subject: { Data: 'Test Email - SES Provider', Charset: 'UTF-8' },
        Body: { Html: { Data: generateTestEmailHTML('ses'), Charset: 'UTF-8' } },
      },
    });

    const result = await client.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    return { success: false, error: `SES Error: ${error.message}` };
  }
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting test email provider function...');
    
    // Parse request body first
    const { provider_type, config, test_email }: TestEmailRequest = await req.json();
    console.log('Parsed test email request:', { provider_type, test_email, configKeys: Object.keys(config || {}) });

    if (!provider_type || !config || !test_email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    if (!test_email.includes('@')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Optional: Add basic auth check if needed
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) {
        console.log('Authentication failed, proceeding with limited access');
      } else {
        console.log('Authenticated user:', user.email);
      }
    }
    
    console.log('Sending test email via', provider_type);
    const result = await sendTestEmail(provider_type, config, test_email);

    console.log('Test email result:', result);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
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