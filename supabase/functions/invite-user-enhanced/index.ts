import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface InviteUserRequest {
  email: string;
  name: string;
  role: string;
  tenant_id?: string;
  department?: string;
  send_email?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      role, 
      tenant_id, 
      department,
      send_email = true 
    }: InviteUserRequest = await req.json();

    console.log('Processing invite request:', { email, role, tenant_id, send_email });

    // Validate required fields
    if (!email || !name || !role) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: email, name, role' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS', 'ACCOUNTANT'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid role',
        availableRoles: validRoles
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For tenant roles, tenant_id is required
    if (role !== 'SUPER_ADMIN' && !tenant_id) {
      return new Response(JSON.stringify({ 
        error: 'tenant_id is required for non-super-admin roles' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('Generated temporary password for user');

    // Create auth user with metadata
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Skip email confirmation for invited users
      user_metadata: {
        role,
        tenant_id,
        name,
        invited: true
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create user account',
        details: authError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Auth user created successfully:', authUser.user?.id);

    // Create user profile in public.users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user!.id,
        email,
        name,
        role,
        tenant_id: tenant_id || null,
        department,
        force_reset: true,
        temp_expires: tempExpires.toISOString(),
        is_active: true,
        invited_by: tenant_id || null,
        invitation_status: 'pending'
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      
      // Rollback: Delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create user profile',
        details: profileError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User profile created successfully');

    // Log the invite action for audit
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: authUser.user!.id,
        actor_email: email,
        tenant_id: tenant_id || null,
        action: 'user_invited',
        resource_type: 'user',
        resource_id: authUser.user!.id,
        description: `User ${email} invited with role ${role}`,
        metadata: {
          role,
          tenant_id,
          department,
          invited_by: 'system' // Could be enhanced to track actual inviter
        }
      });

    // Try to send email if requested
    let emailSent = false;
    let emailError = null;

    if (send_email) {
      try {
        const emailResponse = await supabaseAdmin.functions.invoke('send-temp-password', {
          body: {
            email,
            name,
            tempPassword,
            role,
            hotel_name: tenant_id ? 'Your Hotel' : 'Platform' // Could be enhanced with actual hotel name
          }
        });

        if (emailResponse.error) {
          console.error('Email sending failed:', emailResponse.error);
          emailError = emailResponse.error.message;
        } else {
          emailSent = true;
          console.log('Invitation email sent successfully');
        }
      } catch (error) {
        console.error('Email service error:', error);
        emailError = 'Email service unavailable';
      }
    }

    // Return success response
    const response = {
      success: true,
      user_id: authUser.user!.id,
      email,
      role,
      tenant_id,
      force_reset: true,
      temp_expires: tempExpires.toISOString(),
      email_sent: emailSent,
      // Return temp password only if email sending failed or was not requested
      ...((!send_email || !emailSent) && { temp_password: tempPassword }),
      ...(emailError && { email_error: emailError })
    };

    console.log('Invite process completed:', { 
      user_id: authUser.user!.id, 
      email_sent: emailSent 
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in invite-user-enhanced function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});