import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { email, name, phone, address, role } = await req.json();
    
    console.log('Creating global user:', { email, name, role });

    if (!email || !name || !role) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email, name, and role are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to check existing users' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the role from database
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('scope', 'global')
      .is('tenant_id', null)
      .ilike('name', role)
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role not found:', role);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid role specified',
        code: 'INVALID_ROLE'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate temporary password
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 10) + '!';
    console.log('Generated temporary password');

    // Determine the role enum value based on the actual role name
    let roleEnum = 'SUPPORT_STAFF'; // default
    if (roleData.name === 'Super Admin') {
      roleEnum = 'SUPER_ADMIN';
    } else if (roleData.name === 'Platform Admin') {
      roleEnum = 'PLATFORM_ADMIN';
    } else if (roleData.name === 'Support Staff') {
      roleEnum = 'SUPPORT_STAFF';
    } else if (roleData.name === 'Sales') {
      roleEnum = 'SUPPORT_STAFF'; // Map Sales to SUPPORT_STAFF for now
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: roleEnum,
        role_id: roleData.id,
        scope: 'global',
        tenant_id: null
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create user account' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!authUser?.user?.id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create user account' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create or update user profile
    const { error: userInsertError } = await supabaseAdmin.from('users').upsert({
      id: authUser.user.id,
      email,
      name,
      phone,
      address,
      role: roleEnum,
      role_id: roleData.id,
      tenant_id: null,
      force_reset: true,
      is_active: true,
      is_platform_owner: roleData.name === 'Super Admin', // Mark super admins as platform owners
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

    if (userInsertError) {
      console.error('Failed to create user profile:', userInsertError);
      // Cleanup auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log('Cleaned up auth user after profile creation failure');
      } catch (e) {
        console.error('Cleanup failed:', e);
      }
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create user profile' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Global user created successfully:', authUser.user.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Global user created successfully',
      user: {
        id: authUser.user.id,
        email,
        name,
        role: roleData.name
      },
      tempPassword
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});