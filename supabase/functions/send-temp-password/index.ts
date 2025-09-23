import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendTempPasswordRequest {
  to_email?: string; // Legacy field for backward compatibility
  email?: string;    // New field for staff invites
  hotel_name?: string;
  temp_password?: string;
  tempPassword?: string; // Alternative field name
  login_url?: string;
  name?: string;     // Recipient name for staff invites
  role?: string;     // User role for staff invites
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to_email, 
      email, 
      hotel_name = "Hotel Management System", 
      temp_password, 
      tempPassword,
      login_url,
      name,
      role 
    }: SendTempPasswordRequest = await req.json();

    // Normalize field names (support both old and new formats)
    const recipientEmail = email || to_email;
    const password = tempPassword || temp_password;
    const recipientName = name || 'User';
    const userRole = role || 'Staff';
    
    if (!recipientEmail || !password) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: email and password' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Only send to verified domain owner in Resend test mode - REMOVED FOR PRODUCTION
    // This restriction should be removed when deploying to production with a verified domain
    /*
    if (recipientEmail !== 'engsholawasiu@gmail.com') {
      console.log(`Skipping email to ${recipientEmail} - only verified domain owner (engsholawasiu@gmail.com) can receive emails in Resend test mode`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email skipped - Resend test mode only allows verified domain owner',
        note: 'In production, this email would be sent normally'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    */

    console.log(`Sending temporary password email to ${recipientEmail} for ${hotel_name}`);

    // Determine if this is a staff invite or hotel owner signup
    const isStaffInvite = role && role !== 'OWNER';
    const defaultLoginUrl = login_url || (role === 'SUPER_ADMIN' ? 'https://your-domain.com/sa-dashboard' : 'https://your-domain.com/owner-dashboard');

    const emailResponse = await resend.emails.send({
      from: "Hotel SaaS <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: isStaffInvite 
        ? `Welcome to ${hotel_name} - Your Account Details`
        : `Welcome to Hotel SaaS - Your ${hotel_name} account is ready!`,
      html: isStaffInvite ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Welcome to ${hotel_name}</h1>
            <p>Your account has been created</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2>Hello ${recipientName},</h2>
            
            <p>You've been invited to join <strong>${hotel_name}</strong> as a <strong>${userRole.replace('_', ' ')}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #4f46e5; margin: 20px 0;">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${recipientEmail}</p>
              <p><strong>Temporary Password:</strong> <strong>${password}</strong></p>
              <p><strong>Role:</strong> ${userRole.replace('_', ' ')}</p>
            </div>
            
            <div style="background: #fef3c7; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>⚠️ Important Security Notice:</strong>
              <ul>
                <li>This is a temporary password that expires in 24 hours</li>
                <li>You must change your password on first login</li>
                <li>Keep these credentials secure and don't share them</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${defaultLoginUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Login to Your Dashboard</a>
            </div>
            
            <h3>What's Next?</h3>
            <ol>
              <li>Click the login button above or visit your dashboard</li>
              <li>Use the credentials provided to sign in</li>
              <li>You'll be prompted to create a new secure password</li>
              <li>Complete your profile setup</li>
            </ol>
            
            <p>If you have any questions or need assistance, please contact your system administrator.</p>
            
            <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
              <p>This invitation was sent automatically by the ${hotel_name} management system.</p>
              <p>If you didn't expect this invitation, please contact support immediately.</p>
            </div>
          </div>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a202c; margin-bottom: 10px;">Welcome to Hotel SaaS!</h1>
            <p style="color: #718096; font-size: 16px;">Your ${hotel_name} management system is ready</p>
          </div>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin-top: 0;">Your Account Details</h2>
            <p style="margin: 10px 0;"><strong>Hotel:</strong> ${hotel_name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${recipientEmail}</p>
            <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${password}</code></p>
          </div>
          
          <div style="background: #fed7d7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #c53030; font-weight: 600;">⚠️ Important Security Notice</p>
            <p style="margin: 10px 0 0 0; color: #742a2a;">This is a temporary password that expires in 24 hours. You must change it on first login for security purposes.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${defaultLoginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Login to Your Dashboard
            </a>
          </div>
          
          <div style="margin-top: 30px;">
            <h3 style="color: #2d3748;">Next Steps:</h3>
            <ol style="color: #4a5568; padding-left: 20px;">
              <li>Click the login button above or visit: <a href="${defaultLoginUrl}">${defaultLoginUrl}</a></li>
              <li>Use the temporary password to sign in</li>
              <li>You'll be prompted to create a new secure password</li>
              <li>Complete your hotel setup through the onboarding wizard</li>
              <li>Start managing your hotel operations!</li>
            </ol>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
            <p>Need help? Reply to this email or contact our support team.</p>
            <p style="margin: 5px 0 0 0;">This email was sent because a Hotel SaaS account was created for ${hotel_name}.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-temp-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);