import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: normalize role names to match DB values
const normalize = (s: string | null | undefined) => (s || '').trim();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    const payload = await req.json();
    const email = normalize(payload.email).toLowerCase();
    const rawRole = normalize(payload.role);
    const name = normalize(payload.name) || null;
    const phone = normalize(payload.phone) || null;
    const address = normalize(payload.address) || null;

    if (!email || !rawRole) {
      return new Response(JSON.stringify({ success: false, error: 'Email and role are required', code: 'MISSING_FIELDS' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Creating global user:', { email, rawRole, name, phone, address });

    // 1) Try to find a matching global role using multiple strategies
    // Prefer exact, then ilike, then partial
    const roleCandidates = [];

    // Exact
    let { data: exact } = await supabaseAdmin.from('roles').select('id, name').eq('scope', 'global').is('tenant_id', null).eq('name', rawRole).maybeSingle();
    if (exact) roleCandidates.push(exact);

    // Case-insensitive
    if (!roleCandidates.length) {
      const { data: ci } = await supabaseAdmin.from('roles').select('id, name').eq('scope', 'global').is('tenant_id', null).ilike('name', rawRole).limit(1);
      if (ci && ci.length) roleCandidates.push(ci[0]);
    }

    // Partial/alias: try normalized tokens
    if (!roleCandidates.length) {
      const token = rawRole.split(' ')[0];
      const { data: partial } = await supabaseAdmin.from('roles').select('id, name').eq('scope', 'global').is('tenant_id', null).ilike('name', `%${token}%`).limit(1);
      if (partial && partial.length) roleCandidates.push(partial[0]);
    }

    if (!roleCandidates.length) {
      // Return available roles to help caller fix payload
      const { data: availableRoles } = await supabaseAdmin.from('roles').select('name').eq('scope', 'global').is('tenant_id', null);
      return new Response(JSON.stringify({ success: false, error: 'Invalid role', code: 'INVALID_ROLE', availableRoles: (availableRoles || []).map((r:any) => r.name) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const roleData = roleCandidates[0];

    // Map role names from roles table to users table format
    const roleMapping: Record<string, string> = {
      'Super Admin': 'SUPER_ADMIN',
      'Platform Admin': 'PLATFORM_ADMIN',
      'Support Staff': 'SUPPORT_STAFF',
      'Sales': 'SALES'
    };
    
    const userRole = roleMapping[roleData.name] || roleData.name.toUpperCase().replace(' ', '_');

    // 2) Prevent duplicate users - check BOTH auth and profile tables
    const { data: existingDbUser } = await supabaseAdmin.from('users').select('id, email').eq('email', email).maybeSingle();
    if (existingDbUser) {
      console.log('User already exists in profiles:', existingDbUser.email);
      return new Response(JSON.stringify({ success: false, error: 'User with this email already exists', code: 'USER_EXISTS', existing_user: { id: existingDbUser.id, email: existingDbUser.email } }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if auth user exists (in case of partial creation)
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const authUserExists = existingAuthUser.users?.find(u => u.email === email);
    if (authUserExists) {
      console.log('Auth user already exists:', email);
      return new Response(JSON.stringify({ success: false, error: 'User with this email already exists in auth', code: 'USER_EXISTS', existing_user: { id: authUserExists.id, email: authUserExists.email } }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3) Generate secure temporary password
    const rand = new Uint8Array(16);
    crypto.getRandomValues(rand);
    // base64url
    const tempPassword = btoa(String.fromCharCode(...rand)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    console.log('Generated temporary password for user');

    // 4) Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: userRole,
        role_id: roleData.id,
        scope: 'global',
        tenant_id: null
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      // Map common error codes
      return new Response(JSON.stringify({ success: false, error: 'Failed to create auth user', code: 'AUTH_ERROR', details: authError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!authUser?.user?.id) {
      console.error('Auth returned no user');
      return new Response(JSON.stringify({ success: false, error: 'Auth did not return user', code: 'AUTH_NO_USER' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = authUser.user.id;

    // 5) Insert profile record; keep force_reset and temp fields present in schema
    const { error: userInsertError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      name,
      phone,
      address,
      role: userRole,
      role_id: roleData.id,
      tenant_id: null,
      force_reset: true,
      temp_password_hash: null,
      temp_expires: null,
      is_active: true
    });

    if (userInsertError) {
      console.error('Failed to create user profile:', userInsertError);
      // cleanup auth user on profile creation failure
      try { 
        await supabaseAdmin.auth.admin.deleteUser(userId); 
        console.log('Cleaned up auth user after profile creation failure');
      } catch (e) { 
        console.error('Cleanup failed:', e); 
      }
      return new Response(JSON.stringify({ success: false, error: 'Failed to create user profile', code: 'PROFILE_ERROR', details: userInsertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Global user created successfully');

    // 6) Optionally: invoke email function to send temp password (non-blocking)
    try {
      await supabaseAdmin.functions.invoke('send-temp-password', { 
        body: { 
          to_email: email, 
          hotel_name: 'Platform', 
          temp_password: tempPassword, 
          login_url: (req.headers.get('origin') || '') 
        } 
      });
    } catch (e) {
      console.warn('Failed to invoke send-temp-password (non-critical):', e);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Global user created', 
      user: { 
        id: userId, 
        email, 
        name,
        phone,
        role: roleData.name 
      }, 
      tempPassword,
      tempPasswordSent: true 
    }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Unexpected error in create-global-user-fixed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
