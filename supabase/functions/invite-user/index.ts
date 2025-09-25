import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserRequest {
  email: string;
  name: string;
  role: string;
  tenant_id?: string | null;
  department?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = crypto.randomUUID().substring(0, 8);
  console.log(`[${operationId}] Invite user function started`);

  try {
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${operationId}] No authorization header`);
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[${operationId}] Authentication failed:`, authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is authorized
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, tenant_id, is_platform_owner')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error(`[${operationId}] User lookup failed:`, userError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = userData?.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin) {
      console.error(`[${operationId}] Insufficient permissions`);
      return new Response(
        JSON.stringify({ success: false, error: 'Only super admins can invite users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, name, role, tenant_id, department }: InviteUserRequest = await req.json();

    if (!email || !name || !role) {
      console.error(`[${operationId}] Missing required fields`);
      return new Response(
        JSON.stringify({ success: false, error: 'Email, name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${operationId}] Creating user: ${email} with role: ${role}`);

    // Generate a temporary password
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 10) + '!';

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: role,
        tenant_id: tenant_id
      }
    });

    if (createError) {
      console.error(`[${operationId}] Failed to create auth user:`, createError);
      return new Response(
        JSON.stringify({ success: false, error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user record in our users table
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user!.id,
        email: email,
        name: name,
        role: role,
        tenant_id: tenant_id,
        department: department,
        is_active: true,
        is_platform_owner: false, // Never auto-assign platform owner
        force_reset: true // Force password reset on first login
      });

    if (insertError) {
      console.error(`[${operationId}] Failed to create user record:`, insertError);
      
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user!.id);
      
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${operationId}] User created successfully: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        tempPassword: tempPassword,
        userId: newUser.user!.id
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error: any) {
    console.error(`[${operationId}] Error in invite-user function:`, error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});