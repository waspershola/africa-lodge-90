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
  
  // Additional profile fields
  phone?: string;
  address?: string;
  nin?: string;
  date_of_birth?: string;
  nationality?: string;
  employee_id?: string;
  hire_date?: string;
  employment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  bank_name?: string;
  account_number?: string;
  passport_number?: string;
  drivers_license?: string;
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
      send_email = true,
      
      // Additional profile fields
      phone,
      address,
      nin,
      date_of_birth,
      nationality,
      employee_id,
      hire_date,
      employment_type,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      next_of_kin_name,
      next_of_kin_phone,
      next_of_kin_relationship,
      bank_name,
      account_number,
      passport_number,
      drivers_license
    }: InviteUserRequest = await req.json();

    console.log('Processing invite request:', { 
      email, 
      role, 
      tenant_id, 
      send_email,
      has_additional_fields: !!(phone || address || nin || employee_id)
    });

    // Validate required fields
    if (!email || !name || !role) {
      return new Response(JSON.stringify({ 
        success: false,
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
        success: false,
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
        success: false,
        error: 'tenant_id is required for non-super-admin roles' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log('Generated temporary password for user');

    // Check if user already exists (simple check)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active')
      .eq('email', email)
      .maybeSingle();

    // If active user exists, return error
    if (existingUser && existingUser.is_active) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'User already exists and is active',
        details: `A user with email ${email} already exists in the system.` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up existing inactive user if exists
    if (existingUser && !existingUser.is_active) {
      console.log('Cleaning up existing inactive user');
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('email', email);
      
      if (deleteError) {
        console.error('Failed to clean up inactive user:', deleteError);
      }
    }

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
        success: false,
        error: 'Failed to create user account',
        details: authError.message,
        // Still return temp password for manual sharing
        temp_password: tempPassword 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Auth user created successfully:', authUser.user?.id);

    // Create user profile in public.users table with all additional fields
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
        invitation_status: 'pending',
        
        // Additional profile fields
        phone: phone || null,
        address: address || null,
        nin: nin || null,
        date_of_birth: date_of_birth || null,
        nationality: nationality || null,
        employee_id: employee_id || null,
        hire_date: hire_date || null,
        employment_type: employment_type || 'full-time',
        emergency_contact_name: emergency_contact_name || null,
        emergency_contact_phone: emergency_contact_phone || null,
        emergency_contact_relationship: emergency_contact_relationship || null,
        next_of_kin_name: next_of_kin_name || null,
        next_of_kin_phone: next_of_kin_phone || null,
        next_of_kin_relationship: next_of_kin_relationship || null,
        bank_name: bank_name || null,
        account_number: account_number || null,
        passport_number: passport_number || null,
        drivers_license: drivers_license || null
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      
      // Rollback: Delete the auth user we just created
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
        console.log('Successfully rolled back auth user creation');
      } catch (rollbackError) {
        console.error('Failed to rollback auth user:', rollbackError);
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to create user profile',
        details: profileError.message,
        // Still return temp password for manual sharing
        temp_password: tempPassword
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
        description: `User ${email} invited with role ${role}${department ? ` in department ${department}` : ''}${employee_id ? ` (Employee ID: ${employee_id})` : ''}`,
        metadata: {
          role,
          tenant_id,
          department,
          employee_id,
          phone,
          employment_type,
          invited_by: 'system'
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
            hotel_name: tenant_id ? 'Your Hotel' : 'Platform'
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

    // Return success response - ALWAYS include temp_password if email wasn't sent
    const response = {
      success: true,
      user_id: authUser.user!.id,
      email,
      role,
      tenant_id,
      force_reset: true,
      temp_expires: tempExpires.toISOString(),
      email_sent: emailSent,
      // Always return temp password if email not sent or failed
      temp_password: (!send_email || !emailSent) ? tempPassword : undefined,
      ...(emailError && { email_error: emailError })
    };

    console.log('Invite process completed successfully:', { 
      user_id: authUser.user!.id, 
      email_sent: emailSent,
      temp_password_provided: !!response.temp_password
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in invite-user-enhanced function:', error);
    
    // Generate a temp password even for errors
    const emergencyTempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error.message,
      // Provide emergency temp password for manual user creation
      temp_password: emergencyTempPassword
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});