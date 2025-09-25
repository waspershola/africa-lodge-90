import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserRequest {
  email: string;
  name: string;
  role: string;
  tenant_id?: string;
  department?: string;
  set_temp_password?: boolean;
  reset_existing?: boolean;
}

// Generate secure temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Hash password with salt
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hotel_saas_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const operationId = crypto.randomUUID();
  
  console.log(`[${operationId}] invite-user function started`, { timestamp: new Date().toISOString() });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the caller is authenticated and is a super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${operationId}] No authorization header provided`);
      return new Response(JSON.stringify({ 
        error: 'Authorization required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role key to verify the token and get user
    const { data: authResult, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    console.log('Auth check result:', { user: !!authResult?.user, error: !!authError });

    if (authError || !authResult?.user) {
      console.error('Auth error:', authError);
      
      // Check if it's a token expiry error
      const isTokenExpired = authError?.message?.toLowerCase().includes('expired') || 
                           authError?.message?.toLowerCase().includes('invalid') ||
                           authError?.status === 401;
      
      return new Response(JSON.stringify({ 
        error: isTokenExpired ? 'Token expired' : 'Invalid authentication',
        code: isTokenExpired ? 'TOKEN_EXPIRED' : 'AUTH_INVALID',
        message: isTokenExpired ? 'Your session has expired. Please log in again.' : 'Authentication failed.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = authResult.user;

    // Check if caller is super admin or owner/manager
    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (callerError) {
      console.error(`[${operationId}] Failed to fetch caller data:`, callerError);
      return new Response(JSON.stringify({ error: 'Failed to verify user permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${operationId}] Caller permissions check:`, { callerData });

    if (!callerData || (callerData.role !== 'SUPER_ADMIN' && !['OWNER', 'MANAGER'].includes(callerData.role))) {
      console.error(`[${operationId}] Insufficient permissions:`, callerData);
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, name, role, tenant_id, department, set_temp_password, reset_existing }: InviteUserRequest = await req.json();

    console.log(`[${operationId}] Processing invite request:`, {
      email,
      name,
      role,
      tenant_id,
      department,
      set_temp_password,
      reset_existing
    });

    // Validate required fields
    if (!email || !name || !role) {
      console.error(`[${operationId}] Missing required fields:`, { email: !!email, name: !!name, role: !!role });
      return new Response(JSON.stringify({ error: 'Email, name, and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists in auth or public users
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = usersList?.users?.find(u => u.email === email);
    
    // Also check public users table
    const { data: existingPublicUser } = await supabaseAdmin
      .from('users')
      .select('id, email, force_reset, temp_password_hash')
      .eq('email', email)
      .maybeSingle();
    
    if (existingAuthUser || existingPublicUser) {
      // For global users, we can reset their password and force reset if requested
      if (!tenant_id && (callerData.role === 'SUPER_ADMIN') && reset_existing) {
        console.log(`[${operationId}] Resetting existing user password as requested`);
        
        // Generate new temporary password
        const newTempPassword = generateTempPassword();
        const newTempPasswordHash = await hashPassword(newTempPassword);
        const newTempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        let userId = existingPublicUser?.id || existingAuthUser?.id;
        
        try {
          // Update auth user password
          if (existingAuthUser) {
            const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              { password: newTempPassword }
            );
            
            if (updateAuthError) {
              console.error(`[${operationId}] Failed to update auth password:`, updateAuthError);
              return new Response(JSON.stringify({
                success: false,
                error: 'Failed to reset user password',
                code: 'PASSWORD_RESET_FAILED'
              }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            userId = existingAuthUser.id;
          }
          
          // Update public user record
          const { error: updatePublicError } = await supabaseAdmin
            .from('users')
            .update({
              force_reset: true,
              temp_password_hash: newTempPasswordHash,
              temp_expires: newTempExpires.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (updatePublicError) {
            console.error(`[${operationId}] Failed to update public user:`, updatePublicError);
            return new Response(JSON.stringify({
              success: false,
              error: 'Failed to update user record',
              code: 'USER_UPDATE_FAILED'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Try to send reset email
          let emailSent = false;
          try {
            const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app`;
            
            await resend.emails.send({
              from: 'LuxuryHotelSaaS <noreply@mail.luxuryhotelsaas.com>',
              to: [email],
              subject: 'Password Reset - LuxuryHotelSaaS',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1f2937;">Password Reset - LuxuryHotelSaaS</h1>
                  <p>Hello ${name},</p>
                  <p>Your password has been reset by an administrator.</p>
                  
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your New Login Details:</h3>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${newTempPassword}</code></p>
                  </div>
                  
                  <p><strong>Important:</strong> You must change this password on your next login. This temporary password expires in 24 hours.</p>
                  
                  <a href="${loginUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Login to Your Account
                  </a>
                  
                  <p>Best regards,<br>The LuxuryHotelSaaS Team</p>
                </div>
              `,
            });
            emailSent = true;
          } catch (emailError) {
            console.error(`[${operationId}] Failed to send reset email:`, emailError);
          }
          
          // Log audit event
          await supabaseAdmin
            .from('audit_log')
            .insert({
              actor_id: user.id,
              action: 'user_password_reset',
              resource_type: 'user',
              resource_id: userId,
              description: `Reset password for user ${email}`,
              metadata: {
                email,
                role,
                email_sent: emailSent
              }
            });
          
          return new Response(JSON.stringify({
            success: true,
            user: {
              id: userId,
              email,
              name,
              role
            },
            email_sent: emailSent,
            temp_password: emailSent ? null : newTempPassword,
            message: emailSent 
              ? 'Password reset successfully! Reset email sent.'
              : `Password reset but email failed. Temporary password: ${newTempPassword}`,
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
          
        } catch (resetError: any) {
          console.error(`[${operationId}] Error during password reset:`, resetError);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to reset user password',
            code: 'PASSWORD_RESET_ERROR',
            details: resetError.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Standard existing user response
      if (!tenant_id && (callerData.role === 'SUPER_ADMIN')) {
        console.log(`[${operationId}] User exists but caller is super admin - offering password reset option`);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: 'User with this email already exists',
          code: 'USER_EXISTS',
          existing_user: {
            id: existingPublicUser?.id || existingAuthUser?.id,
            email: email,
            can_reset_password: true
          },
          message: 'User already exists. You can reset their password if needed.'
        }), {
          status: 409, // Conflict - more appropriate than 400
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await hashPassword(tempPassword);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user in Supabase Auth (unverified)
    console.log(`[${operationId}] Creating auth user with email: ${email}`);
    console.log(`[${operationId}] User metadata:`, { role, name, tenant_id });
    
    // Prepare user metadata (handle null values explicitly)
    const userMetadata: any = {
      role: role || 'UNKNOWN',
      name: name || 'Unknown User'
    };
    
    // Only add tenant_id if it's not null/undefined
    if (tenant_id) {
      userMetadata.tenant_id = tenant_id;
    }
    
    console.log(`[${operationId}] Final user metadata:`, userMetadata);
    
    let authUser;
    try {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false, // Don't require email confirmation
        user_metadata: userMetadata
      });

      if (createError) {
        console.error(`[${operationId}] Supabase auth createUser error:`, {
          message: createError.message,
          status: createError.status,
          code: createError.code,
          details: createError
        });
        
        // Return a proper error response instead of throwing
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Failed to create authentication account',
          details: createError.message,
          code: createError.code || 'AUTH_CREATE_ERROR',
          debug_info: {
            operation_id: operationId,
            auth_error: createError.message
          }
        }), {
          status: 400, // Use 400 instead of 500 for known errors
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!newUser?.user) {
        console.error(`[${operationId}] No user returned from auth creation`);
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Failed to create authentication account - no user returned',
          code: 'AUTH_NO_USER',
          debug_info: {
            operation_id: operationId
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      authUser = newUser.user;
      console.log(`[${operationId}] Auth user created successfully:`, authUser.id);
      
    } catch (authError: any) {
      console.error(`[${operationId}] Unexpected error during auth user creation:`, {
        error: authError,
        message: authError?.message,
        stack: authError?.stack
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unexpected error during account creation',
        details: authError?.message || 'Unknown error',
        code: 'AUTH_UNEXPECTED_ERROR',
        debug_info: {
          operation_id: operationId,
          error_type: authError?.name || 'Unknown'
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize role name for consistent lookup (handle case variations)
    const normalizeRoleName = (roleName: string): string => {
      const normalized = roleName.trim().toLowerCase();
      
      // Map common variations to canonical names
      const roleAliases: { [key: string]: string } = {
        'super admin': 'Super Admin',
        'super_admin': 'Super Admin',
        'superadmin': 'Super Admin',
        'platform admin': 'Platform Admin', 
        'platform_admin': 'Platform Admin',
        'platformadmin': 'Platform Admin',
        'support staff': 'Support Staff',
        'support_staff': 'Support Staff',
        'supportstaff': 'Support Staff',
        'sales': 'Sales',
        'owner': 'Owner',
        'manager': 'Manager',
        'front desk': 'Front Desk',
        'front_desk': 'Front Desk',
        'frontdesk': 'Front Desk',
        'housekeeping': 'Housekeeping',
        'maintenance': 'Maintenance',
        'accounting': 'Accounting'
      };
      
      return roleAliases[normalized] || roleName;
    };

    // Legacy role mapping for backward compatibility
    const legacyRoleMap: { [key: string]: string } = {
      'Super Admin': 'SUPER_ADMIN',
      'Platform Admin': 'PLATFORM_ADMIN',
      'Support Staff': 'SUPPORT_STAFF',
      'Sales': 'SALES',
      'Owner': 'OWNER',
      'Manager': 'MANAGER',
      'Front Desk': 'FRONT_DESK',
      'Housekeeping': 'HOUSEKEEPING',
      'Maintenance': 'MAINTENANCE',
      'Accounting': 'ACCOUNTING'
    };

    const canonicalRoleName = normalizeRoleName(role);
    const legacyRole = legacyRoleMap[canonicalRoleName] || role.toUpperCase().replace(' ', '_');

    console.log(`[${operationId}] Role normalization:`, { 
      originalRole: role,
      canonicalName: canonicalRoleName,
      legacyRole,
      scope: tenant_id ? 'tenant' : 'global',
      tenant_id 
    });

    // First try exact match, then case-insensitive, then similar names
    let roleQuery = supabaseAdmin
      .from('roles')
      .select('id, name, scope, tenant_id')
      .eq('scope', tenant_id ? 'tenant' : 'global');
    
    // Handle tenant_id filtering properly
    if (tenant_id) {
      roleQuery = roleQuery.eq('tenant_id', tenant_id);
    } else {
      roleQuery = roleQuery.is('tenant_id', null);
    }

    // Try multiple lookup strategies
    let roleData = null;
    let roleError = null;
    
    // Strategy 1: Exact match
    const { data: exactMatch, error: exactError } = await roleQuery.eq('name', canonicalRoleName);
    if (exactMatch && exactMatch.length > 0) {
      roleData = exactMatch[0];
    } else {
      // Strategy 2: Case-insensitive match
      const { data: caseInsensitive, error: caseError } = await roleQuery.ilike('name', canonicalRoleName);
      if (caseInsensitive && caseInsensitive.length > 0) {
        roleData = caseInsensitive[0];
      } else {
        // Strategy 3: Partial match (for variations like "Support Staff" vs "Support")
        const { data: partialMatch, error: partialError } = await roleQuery.ilike('name', `%${canonicalRoleName.split(' ')[0]}%`);
        if (partialMatch && partialMatch.length > 0) {
          roleData = partialMatch[0];
        } else {
          roleError = caseError || partialError || exactError;
        }
      }
    }

    console.log(`[${operationId}] Role lookup result:`, { 
      roleData, 
      roleError,
      searchStrategies: ['exact', 'case-insensitive', 'partial']
    });

    if (roleError || !roleData) {
      console.error(`[${operationId}] Failed to find role after all strategies:`, roleError);
      
      // Get available roles for better error message
      const { data: availableRoles, error: availableRolesError } = await supabaseAdmin
        .from('roles')
        .select('name, scope, tenant_id')
        .eq('scope', tenant_id ? 'tenant' : 'global');
      
      console.log(`[${operationId}] Available roles:`, availableRoles);
      
      // DON'T delete auth user immediately - flag as pending instead
      try {
        await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.id,
            email,
            name,
            role: legacyRole,
            role_id: null, // Mark as pending role assignment
            tenant_id: tenant_id || null,
            department,
            force_reset: true,
            temp_password_hash: await hashPassword(tempPassword),
            temp_expires: tempExpires.toISOString(),
            is_active: false // Keep inactive until role is assigned
          });
        
        console.log(`[${operationId}] User created with pending role assignment`);
      } catch (pendingUserError) {
        console.error(`[${operationId}] Failed to create pending user:`, pendingUserError);
        
        // Only now cleanup auth user if we can't even create pending record
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
          console.log(`[${operationId}] Auth user cleaned up after total failure`);
        } catch (cleanupError) {
          console.error(`[${operationId}] Failed to cleanup auth user:`, cleanupError);
        }
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `Role '${canonicalRoleName}' not found for ${tenant_id ? 'tenant' : 'global'} scope`,
        requested_role: canonicalRoleName,
        scope: tenant_id ? 'tenant' : 'global',
        available_roles: availableRoles?.map(r => r.name) || [],
        pending_user_id: authUser.id,
        message: 'User created but role assignment pending. Please assign a valid role manually.',
        debug_info: {
          operation_id: operationId,
          role_error: roleError?.message,
          available_roles_error: availableRolesError?.message
        }
      }), {
        status: 422, // Unprocessable Entity - partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert user into public.users table with role_id as authoritative source
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.id,
        email,
        name,
        role: legacyRole, // Legacy role for backward compatibility
        role_id: roleData.id, // Authoritative role reference
        tenant_id: tenant_id || null,
        department,
        force_reset: set_temp_password || false, // Force reset if temp password requested
        temp_password_hash: set_temp_password ? tempPasswordHash : null,
        temp_expires: set_temp_password ? tempExpires.toISOString() : null,
        is_active: true // User is fully created and ready
      });

    if (userInsertError) {
      console.error('Failed to create user record:', userInsertError);
      // Clean up auth user if profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        console.log('Auth user cleaned up after user profile creation failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to create user profile',
        details: userInsertError.message,
        hint: userInsertError.code === '23505' ? 'User may already exist in system' : null
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to send invitation email
    let emailSent = false;
    let emailError = null;

    try {
      const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app`;
      
      const emailResult = await resend.emails.send({
        from: 'LuxuryHotelSaaS <noreply@mail.luxuryhotelsaas.com>',
        to: [email],
        subject: 'Welcome to LuxuryHotelSaaS - Your Account is Ready',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Welcome to LuxuryHotelSaaS!</h1>
            <p>Hello ${name},</p>
            <p>Your account has been created with the role: <strong>${role}</strong></p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Login Details:</h3>
              <p><strong>Email:</strong> ${email}</p>
              ${set_temp_password ? `
                <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
                <p style="color: #dc2626; font-weight: 500;">⚠️ You must change this password on your first login. This temporary password expires in 24 hours.</p>
              ` : `
                <p><strong>Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              `}
            </div>
            
            <a href="${loginUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Login to Your Account
            </a>
            
            <p>If you have any questions, please contact your administrator.</p>
            <p>Best regards,<br>The LuxuryHotelSaaS Team</p>
          </div>
        `,
      });

      console.log('Email sent successfully:', emailResult);
      emailSent = true;
    } catch (error) {
      console.error('Failed to send email:', error);
      emailError = (error as Error).message;
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: user.id,
        action: 'user_invited',
        resource_type: 'user',
        resource_id: authUser.id,
        description: `Invited user ${email} with role ${role}`,
        metadata: {
          email,
          role,
          tenant_id,
          department,
          email_sent: emailSent
        }
      });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`[${operationId}] invite-user function completed successfully`, {
      duration_ms: duration,
      email_sent: emailSent,
      user_id: authUser.id
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: authUser.id,
        email,
        name,
        role
      },
      email_sent: emailSent,
      temp_password: emailSent ? null : tempPassword, // Only return password if email failed
      message: emailSent 
        ? `User ${set_temp_password ? 'created with temporary password' : 'invited'} successfully! ${set_temp_password ? 'Password reset' : 'Invitation'} email sent.`
        : `User created but email failed to send. ${set_temp_password ? 'Temporary' : ''} Password: ${tempPassword}`,
      debug_info: {
        operation_id: operationId,
        duration_ms: duration
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`[${operationId}] Error in invite-user function:`, {
      error: error.message,
      stack: error.stack,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error',
      debug_info: {
        operation_id: operationId,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);