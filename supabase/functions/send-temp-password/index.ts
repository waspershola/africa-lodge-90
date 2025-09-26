import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { EmailServiceFactory } from '../_shared/email-service/email-service-factory.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendTempPasswordRequest {
  email: string;
  name: string;
  temp_password: string;
  tenant_id?: string | null;
  from_name?: string;
  hotel_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = crypto.randomUUID().substring(0, 8);
  console.log(`[${operationId}] Send temp password function started`);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const requestData = await req.json();
    const { 
      email, 
      name, 
      temp_password, 
      tenant_id = null,
      from_name = "Hotel Management System",
      hotel_name = "Hotel"
    }: SendTempPasswordRequest = requestData;

    console.log(`[${operationId}] Received request data:`, { 
      email, 
      name, 
      temp_password: temp_password ? '***masked***' : 'missing', 
      tenant_id, 
      from_name, 
      hotel_name 
    });

    if (!email || !name || !temp_password) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!name) missingFields.push('name');
      if (!temp_password) missingFields.push('temp_password');
      
      console.error(`[${operationId}] Missing required fields: ${missingFields.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          received_fields: Object.keys(requestData)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${operationId}] Sending temp password email to: ${email}`);

    // Initialize email service
    const emailService = new EmailServiceFactory();
    
    // Get email provider configuration
    const emailConfig = await emailService.getEmailProviderConfig(tenant_id || 'system');
    
    if (!emailConfig) {
      console.error(`[${operationId}] No email provider configured`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No email provider configured. Please configure an email provider (Resend, MailerSend, or SES) to send emails.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create email content
    const emailSubject = `Your ${hotel_name} Account - Temporary Password`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Account Details</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e1e1e1; }
            .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
            .content { padding: 20px 0; }
            .welcome { font-size: 18px; color: #333; margin-bottom: 20px; }
            .credentials { background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #555; }
            .credential-value { font-family: 'Courier New', monospace; background-color: #e9ecef; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-left: 10px; }
            .important { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
            .important-title { font-weight: bold; color: #856404; margin-bottom: 8px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; text-align: center; color: #6c757d; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${hotel_name}</h1>
            </div>
            
            <div class="content">
              <div class="welcome">
                Hello ${name},
              </div>
              
              <p>Welcome to ${hotel_name}! Your account has been created and you can now access the system.</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <span class="credential-label">Email:</span>
                  <span class="credential-value">${email}</span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">Temporary Password:</span>
                  <span class="credential-value">${temp_password}</span>
                </div>
              </div>
              
              <div class="important">
                <div class="important-title">🔒 Important Security Information:</div>
                <ul>
                  <li><strong>Change your password immediately</strong> after logging in for the first time</li>
                  <li>This temporary password will expire in 7 days</li>
                  <li>Never share your login credentials with anyone</li>
                  <li>If you didn't request this account, please contact your administrator</li>
                </ul>
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact your system administrator.</p>
            </div>
            
            <div class="footer">
              <p>This email was sent from ${hotel_name} Hotel Management System.</p>
              <p>Please do not reply to this email as it's automatically generated.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Prepare email request
    const emailRequest = {
      to: [email],
      subject: emailSubject,
      html: emailHtml,
      from: 'noreply@luxuryhotelpro.com',
      fromName: from_name,
      replyTo: 'support@luxuryhotelpro.com'
    };

    // Send email with fallback
    const emailResult = await emailService.sendEmailWithFallback(
      tenant_id || 'system',
      emailConfig,
      emailRequest,
      'temp_password'
    );

    if (!emailResult.success) {
      console.error(`[${operationId}] Email sending failed:`, emailResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${emailResult.error}`,
          details: emailResult.details 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${operationId}] Email sent successfully via ${emailResult.provider}`);

    // Log the email sending event
    try {
      await supabaseAdmin
        .from('audit_log')
        .insert({
          action: 'EMAIL_SENT',
          resource_type: 'AUTH',
          description: `Temporary password email sent to ${email}`,
          tenant_id: tenant_id,
          metadata: {
            email: email,
            recipient_name: name,
            email_type: 'temp_password',
            provider: emailResult.provider,
            message_id: emailResult.messageId
          }
        });
    } catch (auditError) {
      console.warn(`[${operationId}] Failed to log audit event:`, auditError);
      // Don't fail the request if audit logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Temporary password email sent successfully',
        provider: emailResult.provider,
        messageId: emailResult.messageId
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error: any) {
    console.error(`[${operationId}] Error in send-temp-password function:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});