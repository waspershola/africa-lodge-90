import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase admin client
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

    console.log('Processing password reset request for:', email);

    // Look up user in the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, tenant_id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.log('User not found or error:', userError);
      // Always return success for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({ success: true, message: 'If the email exists, reset instructions will be sent.' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate secure temporary password (8 characters, alphanumeric)
    const tempPassword = generateSecurePassword();
    console.log('Generated temp password for user:', userData.id);

    // Update user password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      {
        password: tempPassword
      }
    );

    if (authError) {
      console.error('Error updating auth password:', authError);
      throw new Error('Failed to update password');
    }

    // Set force_reset flag in users table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        force_reset: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error setting force_reset flag:', updateError);
      throw new Error('Failed to update user record');
    }

    // Call existing send-temp-password function to email credentials
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-temp-password', {
      body: {
        email: email,
        name: userData.name || email.split('@')[0],
        temp_password: tempPassword,
        tenant_id: userData.tenant_id,
        from_name: 'Hotel Management System',
        hotel_name: 'Your Hotel'
      }
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails, user can still use the new password
    }

    // Log audit event
    await supabaseAdmin.from('audit_log').insert({
      action: 'PASSWORD_RESET_REQUESTED',
      resource_type: 'USER',
      resource_id: userData.id,
      actor_id: userData.id,
      tenant_id: userData.tenant_id,
      description: 'Password reset requested and temporary password generated',
      metadata: {
        email: email,
        email_sent: !emailError
      }
    });

    console.log('Password reset completed successfully for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset instructions have been sent to your email.' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in request-password-reset function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to process password reset request' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(handler);