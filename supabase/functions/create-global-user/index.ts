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

    // Generate temporary password
    const tempPassword = generateTempPassword ? generateSecurePassword() : undefined;
    
    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword || 'TempPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        department: department
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authUser.user?.id);

    // Create user record in our users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user!.id,
        email: email,
        name: fullName,
        role: role,
        department: department,
        is_platform_owner: role === 'SUPER_ADMIN',
        is_active: true,
        force_reset: generateTempPassword,
        temp_password: tempPassword,
        temp_expires: generateTempPassword ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null // 7 days
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authUser.user!.id);
      
      return new Response(
        JSON.stringify({ success: false, error: userError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User record created successfully');

    // Log audit trail
    await supabase.from('audit_log').insert({
      action: 'CREATE_GLOBAL_USER',
      resource_type: 'USER',
      resource_id: authUser.user!.id,
      actor_id: null, // System action
      description: `Created global user: ${fullName} (${email}) with role: ${role}`,
      metadata: {
        email,
        role,
        department,
        fullName,
        has_temp_password: !!tempPassword
      }
    });

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
          id: authUser.user!.id,
          email,
          fullName,
          role,
          department,
          tempPassword: tempPassword // Only include in response for manual delivery
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