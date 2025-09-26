import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  user_id: string;
  send_email?: boolean;
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token and verify with service role key
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    console.log('Reset password auth check:', { hasUser: !!user, error: authError?.message });
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is authorized
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role, tenant_id, is_platform_owner')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Authorization error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = userData?.role === 'SUPER_ADMIN';
    const isOwnerOrManager = userData?.role === 'OWNER' || userData?.role === 'MANAGER';

    if (!isSuperAdmin && !isOwnerOrManager) {
      console.error('Authorization error: insufficient permissions');
      return new Response(
        JSON.stringify({ success: false, error: 'Only owners, managers, or super admins can reset passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, send_email = true }: ResetPasswordRequest = await req.json();

    if (!user_id) {
      console.error('Missing user_id in request');
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to reset password for user: ${user_id}`);

    // Get target user details for authorization check
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('users')
      .select('email, role, tenant_id, name')
      .eq('id', user_id)
      .single();

    if (targetUserError) {
      console.error('Error fetching target user:', targetUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found in system' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Target user found: ${targetUser.email} (role: ${targetUser.role})`);

    // Check tenant authorization for non-super admins
    if (!isSuperAdmin) {
      if (!targetUser.tenant_id || targetUser.tenant_id !== userData.tenant_id) {
        console.error('Authorization error: cannot reset password for user from different tenant');
        return new Response(
          JSON.stringify({ success: false, error: 'Cannot reset password for user from different tenant' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);

    try {
      // Reset password in Supabase Auth
      console.log('Resetting password in Supabase Auth...');
      const { error: resetError } = await supabaseClient.auth.admin.updateUserById(user_id, {
        password: tempPassword
      });

      if (resetError) {
        console.error('Failed to reset password:', resetError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to reset password in authentication system', 
            details: resetError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password reset successfully');

      // Update user record to mark password reset required
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({
          force_reset: true,
          temp_password_hash: tempPassword, // In production, this should be hashed
          temp_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .eq('id', user_id);

      if (updateError) {
        console.warn('Failed to update user record:', updateError);
      }

    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unexpected error during password reset',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email if requested
    let emailSent = false;
    if (send_email) {
      try {
        // Get hotel name from tenant data
        let hotel_name = 'Hotel Management System';
        let from_name = 'Hotel Management System';
        
        if (targetUser.tenant_id) {
          const { data: tenantData } = await supabaseClient
            .from('tenants')
            .select('hotel_name')
            .eq('tenant_id', targetUser.tenant_id)
            .single();
          
          if (tenantData?.hotel_name) {
            hotel_name = tenantData.hotel_name;
            from_name = tenantData.hotel_name;
          }
        }

        console.log('Calling send-temp-password with:', { 
          email: targetUser.email, 
          name: targetUser.name, 
          temp_password: tempPassword, 
          tenant_id: targetUser.tenant_id, 
          hotel_name,
          from_name 
        });

        const emailResponse = await supabaseClient.functions.invoke('send-temp-password', {
          body: {
            email: targetUser.email,
            name: targetUser.name || 'User',
            temp_password: tempPassword, // Fixed: was tempPassword, should be temp_password
            tenant_id: targetUser.tenant_id, // Added: was missing
            hotel_name, // Improved: now gets actual hotel name
            from_name // Added: for better email branding
          }
        });

        if (!emailResponse.error) {
          emailSent = true;
          console.log('Email sent successfully');
        } else {
          console.warn('Failed to send email:', emailResponse.error);
        }
      } catch (emailError) {
        console.warn('Failed to send email:', emailError);
      }
    }

    // Log audit event
    try {
      await supabaseClient
        .from('audit_log')
        .insert({
          actor_id: user.id,
          action: 'password_reset',
          resource_type: 'user',
          resource_id: user_id,
          tenant_id: targetUser.tenant_id || userData.tenant_id,
          description: `Password reset for user ${targetUser.email} by ${userData.role.toLowerCase()} ${user.email}`,
          metadata: {
            target_email: targetUser.email,
            target_role: targetUser.role,
            reset_by: user.email,
            email_sent: emailSent
          }
        });
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    console.log(`Password reset successfully for ${targetUser.email} by ${userData.role.toLowerCase()} ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully',
        temp_password: tempPassword,
        email_sent: emailSent,
        user: {
          email: targetUser.email,
          role: targetUser.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in reset-user-password function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);