import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, role, name, phone, address } = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email and role are required',
          code: 'MISSING_FIELDS'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating global user:', { email, role, name, phone, address });

    // Look up the role in the database (global scope only)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('scope', 'global')
      .ilike('name', role.trim())
      .is('tenant_id', null)
      .maybeSingle();

    if (roleError) {
      console.error('Role lookup error:', roleError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to lookup role',
          code: 'ROLE_LOOKUP_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData) {
      // Get available global roles for error message
      const { data: availableRoles } = await supabaseAdmin
        .from('roles')
        .select('name')
        .eq('scope', 'global')
        .is('tenant_id', null);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid role',
          code: 'INVALID_ROLE',
          availableRoles: availableRoles?.map(r => r.name) || ['Super Admin', 'Platform Admin', 'Support Staff']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure temporary password using Web Crypto API
    const randomBytes = new Uint8Array(12);
    crypto.getRandomValues(randomBytes);
    const tempPassword = btoa(String.fromCharCode(...randomBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    console.log('Generated temporary password for user');

    // Check if user already exists
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to check existing users',
          code: 'USER_CHECK_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const existingUser = usersList.users.find(user => user.email === email);
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User with this email already exists',
          code: 'USER_EXISTS',
          existing_user: {
            id: existingUser.id,
            email: existingUser.email,
            can_reset_password: true
          }
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user with temporary password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        role_id: roleData.id,
        force_password_reset: true,
        scope: 'global'
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create authentication user',
          code: 'AUTH_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authUser.user?.id);

    // Insert into public.users table
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user!.id,
        email: authUser.user!.email!,
        name: name || null,
        phone: phone || null,
        address: address || null,
        role: roleData.name,
        role_id: roleData.id,
        tenant_id: null, // Global users have no tenant
        force_reset: true,
        is_active: true
      });

    if (userInsertError) {
      console.error('User insert error:', userInsertError);
      
      // Try to clean up the auth user if public user creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create user profile',
          code: 'PROFILE_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Global user created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        tempPassword,
        message: 'Global user created successfully',
        user: {
          id: authUser.user!.id,
          email: authUser.user!.email,
          name: name || null,
          phone: phone || null,
          role: roleData.name
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in create-global-user:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});