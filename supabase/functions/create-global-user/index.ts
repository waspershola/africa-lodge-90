import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateGlobalUserRequest {
  fullName: string;
  email: string;
  role: string;
  department?: string;
  generateTempPassword: boolean;
  sendEmail: boolean;
}

// Generate a secure temporary password
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create global user function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      fullName, 
      email, 
      role, 
      department,
      generateTempPassword,
      sendEmail 
    }: CreateGlobalUserRequest = await req.json();

    console.log('Creating global user:', { email, role, fullName });

    // Validate required fields
    if (!fullName || !email || !role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Full name, email, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists in auth or users table
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const authUserExists = existingAuthUsers?.users?.find(user => user.email === email);
    
    const { data: existingUserRecord, error: checkUserError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (checkUserError) {
      console.error('Error checking existing user:', checkUserError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to check existing user: ${checkUserError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user exists in both auth and users table, return error
    if (authUserExists && existingUserRecord) {
      return new Response(
        JSON.stringify({ success: false, error: `User with email ${email} already exists` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user exists only in auth but not in users table, create the missing users record
    if (authUserExists && !existingUserRecord) {
      console.log('Found orphaned auth user, creating missing users record:', email);
      try {
        const tempPassword = generateTempPassword ? generateSecurePassword() : null;
        
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            id: authUserExists.id,
            email: email,
            name: fullName,
            role: role,
            department: department,
            tenant_id: null, // Global users have null tenant_id
            is_platform_owner: false, // Never auto-assign platform owner - requires manual approval
            is_active: true,
            force_reset: generateTempPassword,
            temp_password_hash: tempPassword,
            temp_expires: generateTempPassword ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
          })
          .select()
          .single();

        if (userError) {
          console.error('Error creating missing users record:', userError);
          return new Response(
            JSON.stringify({ success: false, error: `Failed to create user record: ${userError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Created missing users record successfully');
        
        // Log audit trail
        try {
          await supabase.from('audit_log').insert({
            action: 'REPAIR_ORPHANED_USER',
            resource_type: 'USER',
            resource_id: authUserExists.id,
            actor_id: null,
            description: `Repaired orphaned auth user: ${fullName} (${email}) with role: ${role}`,
            metadata: {
              email,
              role,
              department,
              fullName,
              was_orphaned: true
            }
          });
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: {
              id: authUserExists.id,
              email,
              fullName,
              role,
              department,
              tempPassword: tempPassword
            },
            message: 'Orphaned user repaired successfully'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (repairError) {
        console.error('Failed to repair orphaned user:', repairError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to repair orphaned user. Please contact admin.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If user exists only in users table but not in auth (shouldn't happen, but handle it)
    if (!authUserExists && existingUserRecord) {
      console.log('Found orphaned users record, cleaning up:', email);
      await supabase.from('users').delete().eq('id', existingUserRecord.id);
    }

    // Generate temporary password
    const tempPassword = generateTempPassword ? generateSecurePassword() : 'TempPassword123!';
    
    console.log('Creating auth user with email:', email);
    
    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        department: department
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      // Handle specific error cases
      if (authError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ success: false, error: `User with email ${email} already exists` }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: `Failed to create user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create auth user - no user returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Wait a moment for any database triggers to complete
    await new Promise(resolve => setTimeout(resolve, 100));

  // Create user record in our users table
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .upsert({
      id: authUser.user.id,
      email: email,
      name: fullName,
      role: role,
      department: department,
      tenant_id: null, // Global users have null tenant_id
      is_platform_owner: false, // Never auto-assign platform owner - requires manual approval
      is_active: true,
      force_reset: generateTempPassword,
      temp_password_hash: generateTempPassword ? tempPassword : null,
      temp_expires: generateTempPassword ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (userError) {
    console.error('Error upserting user record:', userError);
    
    // Clean up auth user if database insert fails
    try {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.log('Cleaned up auth user due to database error');
    } catch (cleanupError) {
      console.error('Failed to clean up auth user:', cleanupError);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: `Database error: ${userError.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

    console.log('User record created successfully:', newUser.id);

    // Log audit trail
    try {
      await supabase.from('audit_log').insert({
        action: 'CREATE_GLOBAL_USER',
        resource_type: 'USER',
        resource_id: authUser.user.id,
        actor_id: null, // System action
        description: `Created global user: ${fullName} (${email}) with role: ${role}`,
        metadata: {
          email,
          role,
          department,
          fullName,
          has_temp_password: generateTempPassword
        }
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the whole operation for audit log issues
    }

    // TODO: Send email with credentials if requested
    // This would require email service setup (Resend, etc.)
    if (sendEmail && tempPassword) {
      console.log('Email sending not implemented yet, but would send to:', email);
      console.log('Temporary password:', tempPassword);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authUser.user.id,
          email,
          fullName,
          role,
          department,
          tempPassword: generateTempPassword ? tempPassword : undefined
        },
        message: 'Global user created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create global user error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Failed to create global user' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});