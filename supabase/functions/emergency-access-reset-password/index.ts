import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  sessionToken: string;
  newPassword: string;
  userAgent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionToken, newPassword, userAgent }: PasswordResetRequest = await req.json();
    
    // Get client IP address - handle multiple IPs from proxy headers
    const rawIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const clientIP = rawIP.split(',')[0].trim(); // Take first IP if multiple
    
    console.log(`Emergency password reset attempt from IP: ${clientIP}`);

    // Validate session
    const { data: session, error: sessionError } = await supabaseClient
      .from('recovery_sessions')
      .select(`
        *,
        users!inner(id, email, is_platform_owner)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .eq('completed', true)
      .single();

    if (sessionError || !session) {
      await logPasswordResetAttempt(supabaseClient, null, false, 'Invalid or expired session', clientIP, userAgent);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      await logPasswordResetAttempt(supabaseClient, session.user_id, false, 'Password too weak', clientIP, userAgent);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 8 characters long' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Reset password using Supabase Auth Admin API
    const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
      session.user_id,
      { 
        password: newPassword,
        email_confirm: true // Ensure user is confirmed
      }
    );

    if (resetError) {
      await logPasswordResetAttempt(supabaseClient, session.user_id, false, resetError.message, clientIP, userAgent);
      throw resetError;
    }

    // Update user record
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ 
        last_password_change: new Date().toISOString(),
        password_reset_required: false
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Failed to update user record:', updateError);
    }

    // Mark session as used and expire it
    await supabaseClient
      .from('recovery_sessions')
      .update({ 
        expires_at: new Date().toISOString() // Expire immediately
      })
      .eq('session_token', sessionToken);

    // Log successful password reset
    await logPasswordResetAttempt(supabaseClient, session.user_id, true, 'Password reset successfully via emergency access', clientIP, userAgent);

    // Log in audit trail
    await supabaseClient
      .from('audit_log')
      .insert({
        action: 'EMERGENCY_PASSWORD_RESET',
        resource_type: 'SECURITY',
        resource_id: session.user_id,
        actor_id: session.user_id,
        description: `Platform owner password reset via emergency access portal`,
        metadata: {
          ip_address: clientIP,
          user_agent: userAgent,
          session_token: sessionToken,
          timestamp: new Date().toISOString()
        },
        ip_address: clientIP,
        user_agent: userAgent
      });

    // Send security alert email (if email service is configured)
    try {
      const { data: emailSettings } = await supabaseClient
        .from('hotel_settings')
        .select('email_settings')
        .limit(1)
        .single();

      if (emailSettings?.email_settings?.from_email) {
        await supabaseClient.functions.invoke('send-security-alert', {
          body: {
            to: session.users.email,
            type: 'emergency_password_reset',
            metadata: {
              ip_address: clientIP,
              timestamp: new Date().toISOString(),
              user_agent: userAgent
            }
          }
        });
      }
    } catch (emailError) {
      console.warn('Failed to send security alert email:', emailError);
      // Don't fail the password reset if email fails
    }

    console.log(`Emergency password reset successful for user: ${session.users.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Emergency password reset error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function logPasswordResetAttempt(
  supabaseClient: any,
  userId: string | null,
  success: boolean,
  reason: string,
  ipAddress: string,
  userAgent?: string
) {
  try {
    await supabaseClient
      .from('emergency_access_attempts')
      .insert({
        user_id: userId,
        attempt_type: 'password_reset',
        success,
        failure_reason: success ? null : reason,
        ip_address: ipAddress,
        user_agent: userAgent,
        verification_data: {
          timestamp: new Date().toISOString(),
          step: 'password_reset'
        }
      });
  } catch (error) {
    console.error('Failed to log password reset attempt:', error);
  }
}

serve(handler);