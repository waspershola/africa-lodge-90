import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EmailServiceFactory } from '../_shared/email-service/email-service-factory.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  reservationId?: string;
  testEmail?: string;
  type: 'confirmation' | 'invoice' | 'reminder' | 'group_confirmation' | 'test';
  templateType?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
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

    const { reservationId, testEmail, type, templateType }: EmailRequest = await req.json();

    const emailFactory = new EmailServiceFactory();

    // For test emails
    if (type === 'test' && testEmail) {
      // Get tenant ID from auth
      const authHeader = req.headers.get('authorization');
      let tenantId: string | null = null;
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        tenantId = user?.user_metadata?.tenant_id;
      }

      if (!tenantId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Authentication required' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get email provider configuration
      const config = await emailFactory.getEmailProviderConfig(tenantId);
      if (!config) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Email provider not configured' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await emailFactory.sendEmailWithFallback(
        tenantId,
        config,
        {
          to: [testEmail],
          subject: 'Test Email - Hotel Management System',
          html: generateTestEmailHTML(),
          from: 'noreply@example.com',
          fromName: 'Hotel Management'
        },
        'test'
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (false) { // Placeholder to maintain structure
        throw new Error(`Resend API error: ${resendResponse.statusText}`);
      }

      const result = await resendResponse.json();
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get reservation data with tenant isolation
    if (!reservationId) {
      throw new Error('Reservation ID is required for non-test emails');
    }

    const { data: reservation, error: reservationError } = await supabaseClient
      .from('reservations')
      .select(`
        *,
        guests(*),
        rooms(room_number, room_types(name)),
        group_reservations(*)
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      throw new Error('Reservation not found');
    }

    // Get tenant info and email settings with strict isolation
    const { data: hotelSettings, error: settingsError } = await supabaseClient
      .from('hotel_settings')
      .select('email_settings')
      .eq('tenant_id', reservation.tenant_id)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
    }

    const { data: tenantInfo, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('hotel_name, hotel_slug, address, city, country, phone, email')
      .eq('tenant_id', reservation.tenant_id)
      .single();

    if (tenantError || !tenantInfo) {
      throw new Error('Tenant information not found');
    }

    const emailSettings = hotelSettings?.email_settings || {};
    const template = generateEmailTemplate(type, reservation, tenantInfo, emailSettings);

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${emailSettings.from_name || `Hotel ${tenantInfo.hotel_name}`} <onboarding@resend.dev>`,
        to: [reservation.guest_email],
        reply_to: emailSettings.reply_to_email || tenantInfo.email,
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${resendResponse.statusText} - ${errorText}`);
    }

    const result = await resendResponse.json();

    // Log email activity
    await supabaseClient
      .from('audit_log')
      .insert({
        tenant_id: reservation.tenant_id,
        action: 'email_sent',
        resource_type: 'reservation',
        resource_id: reservationId,
        description: `${type} email sent to ${reservation.guest_email}`,
        metadata: { email_type: type, email_id: result.id }
      });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    } catch (error) {
      console.error('Email function error:', error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          success: false 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
});

function generateTestEmailHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Hotel Management System</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Test Email Delivery</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2563eb; margin-top: 0;">✅ Email System Working!</h2>
        <p>This is a test email to verify your email delivery system is configured correctly.</p>
        <p>If you received this email, your hotel's email system is ready to send:</p>
        <ul>
          <li>Reservation confirmations</li>
          <li>Invoice notifications</li>
          <li>Payment reminders</li>
          <li>Group booking communications</li>
        </ul>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
        <p>Powered by Hotel Management System</p>
      </div>
    </body>
    </html>
  `;
}

function generateEmailTemplate(
  type: string, 
  reservation: any, 
  tenantInfo: any, 
  emailSettings: any
): EmailTemplate {
  const hotelName = tenantInfo.hotel_name;
  const headerColor = emailSettings.branding?.header_color || '#2563eb';
  const accentColor = emailSettings.branding?.accent_color || '#f59e0b';
  const footerText = emailSettings.branding?.footer_text || 'Thank you for choosing us!';

  const baseHTML = (content: string, subject: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">${hotelName}</h1>
          <div style="width: 60px; height: 3px; background: ${accentColor}; margin: 15px auto;"></div>
        </div>
        
        <div style="padding: 40px 30px;">
          ${content}
        </div>
        
        <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">${footerText}</p>
          ${tenantInfo.address ? `<p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">${tenantInfo.address}${tenantInfo.city ? `, ${tenantInfo.city}` : ''}${tenantInfo.country ? `, ${tenantInfo.country}` : ''}</p>` : ''}
          ${tenantInfo.phone ? `<p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Phone: ${tenantInfo.phone}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  switch (type) {
    case 'confirmation':
      const confirmationSubject = `Reservation Confirmation - ${hotelName}`;
      const confirmationContent = `
        <h2 style="color: ${headerColor}; margin-top: 0;">Reservation Confirmed!</h2>
        <p>Dear ${reservation.guest_name},</p>
        <p>Thank you for choosing ${hotelName}. Your reservation has been confirmed with the following details:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${accentColor}; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Reservation Number:</strong> ${reservation.reservation_number}</p>
          <p style="margin: 0 0 10px 0;"><strong>Guest Name:</strong> ${reservation.guest_name}</p>
          <p style="margin: 0 0 10px 0;"><strong>Room:</strong> ${reservation.rooms?.room_number} (${reservation.rooms?.room_types?.name})</p>
          <p style="margin: 0 0 10px 0;"><strong>Check-in:</strong> ${new Date(reservation.check_in_date).toLocaleDateString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Check-out:</strong> ${new Date(reservation.check_out_date).toLocaleDateString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Adults:</strong> ${reservation.adults}</p>
          ${reservation.children > 0 ? `<p style="margin: 0 0 10px 0;"><strong>Children:</strong> ${reservation.children}</p>` : ''}
          <p style="margin: 0;"><strong>Total Amount:</strong> ${reservation.total_amount}</p>
        </div>
        
        <p>We look forward to welcoming you to ${hotelName}. If you have any questions or special requests, please don't hesitate to contact us.</p>
      `;
      return { subject: confirmationSubject, html: baseHTML(confirmationContent, confirmationSubject) };

    case 'group_confirmation':
      const groupSubject = `Group Reservation Confirmation - ${hotelName}`;
      const groupContent = `
        <h2 style="color: ${headerColor}; margin-top: 0;">Group Reservation Confirmed!</h2>
        <p>Dear ${reservation.guest_name},</p>
        <p>Your group reservation at ${hotelName} has been confirmed. Thank you for choosing us for your group stay.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${accentColor}; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Reservation Number:</strong> ${reservation.reservation_number}</p>
          <p style="margin: 0 0 10px 0;"><strong>Check-in:</strong> ${new Date(reservation.check_in_date).toLocaleDateString()}</p>
          <p style="margin: 0 0 10px 0;"><strong>Check-out:</strong> ${new Date(reservation.check_out_date).toLocaleDateString()}</p>
          <p style="margin: 0;"><strong>Total Amount:</strong> ${reservation.total_amount}</p>
        </div>
        
        <p>We're excited to host your group at ${hotelName}. Our team is ready to ensure your stay exceeds expectations.</p>
      `;
      return { subject: groupSubject, html: baseHTML(groupContent, groupSubject) };

    case 'reminder':
      const reminderSubject = `Payment Reminder - ${hotelName}`;
      const reminderContent = `
        <h2 style="color: ${headerColor}; margin-top: 0;">Payment Reminder</h2>
        <p>Dear ${reservation.guest_name},</p>
        <p>This is a friendly reminder that payment is due for your upcoming reservation at ${hotelName}.</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid ${accentColor}; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Reservation Number:</strong> ${reservation.reservation_number}</p>
          <p style="margin: 0 0 10px 0;"><strong>Amount Due:</strong> ${reservation.total_amount}</p>
          <p style="margin: 0 0 10px 0;"><strong>Check-in Date:</strong> ${new Date(reservation.check_in_date).toLocaleDateString()}</p>
        </div>
        
        <p>Please ensure payment is completed before your arrival date. If you have any questions about your reservation or payment, please contact us.</p>
      `;
      return { subject: reminderSubject, html: baseHTML(reminderContent, reminderSubject) };

    default:
      const defaultSubject = `Notification - ${hotelName}`;
      const defaultContent = `
        <h2 style="color: ${headerColor}; margin-top: 0;">Hotel Notification</h2>
        <p>Dear ${reservation.guest_name},</p>
        <p>Thank you for your reservation at ${hotelName}.</p>
      `;
      return { subject: defaultSubject, html: baseHTML(defaultContent, defaultSubject) };
  }
}