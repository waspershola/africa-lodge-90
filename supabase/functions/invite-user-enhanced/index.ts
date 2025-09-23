import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase with service role key for admin operations
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  });
}

const supabaseAdmin = createClient(
  supabaseUrl ?? '',
  supabaseServiceKey ?? ''
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
  console.log('Edge function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
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
      console.error('Missing required fields:', { email: !!email, name: !!name, role: !!role });
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: email, name, role' 
      }), {
        status: 200,
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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For tenant roles, tenant_id is required
    if (role !== 'SUPER_ADMIN' && !tenant_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'tenant_id is required for non-super-admin roles' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log('Generated temporary password for user');

    // Check for global email uniqueness across ALL tenants AND auth system
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, tenant_id')
      .eq('email', email);

    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to validate email uniqueness',
        details: checkError.message,
        temp_password: !send_email ? tempPassword : undefined
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check auth.users for existing auth accounts using listUsers
    let existingAuthUser = null;
    try {
      const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000 // Should be enough to find the user
      });
      
      if (!authListError && authUsers?.users) {
        existingAuthUser = authUsers.users.find(user => user.email === email);
        if (existingAuthUser) {
          console.log('Found existing auth user:', existingAuthUser.id);
        }
      }
    } catch (error) {
      console.warn('Could not check auth users:', error);
    }

    // Check if email exists in ANY tenant (global uniqueness)
    if (existingUsers && existingUsers.length > 0) {
      const activeUser = existingUsers.find(u => u.is_active);
      
      if (activeUser) {
        // Check if it's in a different tenant
        if (activeUser.tenant_id !== tenant_id) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Email already registered in another tenant',
            details: `This email is already registered under another tenant. Please remove the user from their current tenant before reassigning, or use a different email address.`,
            temp_password: !send_email ? tempPassword : undefined
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Same tenant - user already exists
          return new Response(JSON.stringify({ 
            success: false,
            error: 'User already exists in this tenant',
            details: `A user with email ${email} already exists in your tenant and is active.`,
            temp_password: !send_email ? tempPassword : undefined
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // If we have inactive users, clean them up
      const inactiveUsers = existingUsers.filter(u => !u.is_active);
      if (inactiveUsers.length > 0) {
        console.log('Cleaning up inactive users for email:', email);
        for (const inactiveUser of inactiveUsers) {
          // Delete from users table
          await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', inactiveUser.id);
          
          // Delete from auth if exists
          try {
            await supabaseAdmin.auth.admin.deleteUser(inactiveUser.id, false);
          } catch (authError) {
            console.warn('Failed to delete auth user (may not exist):', authError);
          }
        }
      }
    }

    // Clean up orphaned auth users that don't have public user records
    if (existingAuthUser && (!existingUsers || existingUsers.length === 0)) {
      console.log('Cleaning up orphaned auth user for email:', email);
      try {
        await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id, false);
        existingAuthUser = null; // Reset so we create a fresh user
        console.log('Successfully cleaned up orphaned auth user');
      } catch (error) {
        console.warn('Failed to clean up orphaned auth user:', error);
      }
    }

    // Handle existing auth user
    let finalAuthUser;
    let authUserId;
    let createdNewAuthUser = false;
    
    if (existingAuthUser) {
      // Use existing auth user
      finalAuthUser = existingAuthUser;
      authUserId = existingAuthUser.id;
      console.log('Using existing auth user:', authUserId);
      
      // Update password for existing auth user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: tempPassword,
        user_metadata: {
          role,
          tenant_id,
          name,
          invited: true
        }
      });
      
      if (updateError) {
        console.error('Error updating existing auth user:', updateError);
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Failed to update existing user account',
          details: updateError.message,
          temp_password: !send_email ? tempPassword : undefined
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Create new auth user
      createdNewAuthUser = true;
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
        
        // Handle specific auth errors with proper status codes
        if (authError.code === 'email_exists' || authError.message?.includes('already been registered')) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Email already registered',
            details: 'This email address is already registered in the authentication system. Please use a different email or contact support.',
            temp_password: !send_email ? tempPassword : undefined
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (authError.message?.includes('invalid_email')) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Invalid email address',
            details: 'Please provide a valid email address.',
            temp_password: !send_email ? tempPassword : undefined
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Failed to create user account',
            details: authError.message || 'Unknown authentication error occurred.',
            temp_password: !send_email ? tempPassword : undefined
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      finalAuthUser = authUser.user;
      authUserId = authUser.user!.id;
    }

    console.log('Auth user ready:', authUserId);

    // Handle user profile in public.users table using UPSERT
    let profileError = null;
    
    console.log('Creating/updating public user profile for:', authUserId);
    
    // Use UPSERT to handle both insert and update cases
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUserId,
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
        drivers_license: drivers_license || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    profileError = upsertError;
    console.log('User profile upserted successfully');

    if (profileError) {
      console.error('Error with user profile:', profileError);
      
      // Always rollback if we created a new auth user (prevent orphaned auth users)
      if (createdNewAuthUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          console.log('Successfully rolled back auth user creation');
        } catch (rollbackError) {
          console.error('Failed to rollback auth user:', rollbackError);
        }
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to handle user profile',
        details: profileError.message,
        temp_password: !send_email ? tempPassword : undefined
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User profile created successfully');

    // Log the invite action for audit
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: authUserId,
        actor_email: email,
        tenant_id: tenant_id || null,
        action: 'user_invited',
        resource_type: 'user',
        resource_id: authUserId,
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
      user_id: authUserId,
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
      user_id: authUserId, 
      email_sent: emailSent,
      temp_password_provided: !!response.temp_password
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in invite-user-enhanced function:', error);
    
    // Generate emergency temp password for manual sharing if email not being sent
    const emergencyTempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error.message,
      // Only provide temp password if email is not being sent
      temp_password: emergencyTempPassword
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});