import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendTempPasswordRequest {
  to_email: string;
  hotel_name: string;
  temp_password: string;
  login_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, hotel_name, temp_password, login_url }: SendTempPasswordRequest = await req.json();

    console.log(`Sending temporary password email to ${to_email} for ${hotel_name}`);

    const emailResponse = await resend.emails.send({
      from: "Hotel SaaS <onboarding@resend.dev>",
      to: [to_email],
      subject: `Welcome to Hotel SaaS - Your ${hotel_name} account is ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a202c; margin-bottom: 10px;">Welcome to Hotel SaaS!</h1>
            <p style="color: #718096; font-size: 16px;">Your ${hotel_name} management system is ready</p>
          </div>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin-top: 0;">Your Account Details</h2>
            <p style="margin: 10px 0;"><strong>Hotel:</strong> ${hotel_name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${to_email}</p>
            <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${temp_password}</code></p>
          </div>
          
          <div style="background: #fed7d7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #c53030; font-weight: 600;">⚠️ Important Security Notice</p>
            <p style="margin: 10px 0 0 0; color: #742a2a;">This is a temporary password that expires in 24 hours. You must change it on first login for security purposes.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${login_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Login to Your Dashboard
            </a>
          </div>
          
          <div style="margin-top: 30px;">
            <h3 style="color: #2d3748;">Next Steps:</h3>
            <ol style="color: #4a5568; padding-left: 20px;">
              <li>Click the login button above or visit: <a href="${login_url}">${login_url}</a></li>
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