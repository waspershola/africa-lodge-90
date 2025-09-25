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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Define system owners to create
    const systemOwners = [
      { 
        email: 'wasperstore@gmail.com', 
        tempPassword: 'TempPassword123!',
        name: 'Super Admin',
        role: 'Super Admin'
      },
      { 
        email: 'ceo@waspersolution.com', 
        tempPassword: 'TempPass2024!',
        name: 'CEO',
        role: 'Super Admin'
      },
      { 
        email: 'waspershola@gmail.com', 
        tempPassword: 'TempPass2025!',
        name: 'System Owner',
        role: 'Super Admin'
      }
    ];

    const results = [];

    for (const owner of systemOwners) {
      try {
        console.log(`Creating system owner: ${owner.email}`);

        // Check if user already exists in auth.users
        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
        if (listError) {
          console.error('Error listing users:', listError);
          results.push({ email: owner.email, success: false, error: listError.message });
          continue;
        }

        const existingAuthUser = users.find(u => u.email === owner.email);
        if (existingAuthUser) {
          console.log(`User already exists in auth: ${owner.email}`);
          results.push({ 
            email: owner.email, 
            success: true, 
            message: 'User already exists',
            existing: true 
          });
          continue;
        }

        // Check if user exists in public.users
        const { data: existingUser } = await supabaseClient
          .from('users')
          .select('id, email')
          .eq('email', owner.email)
          .maybeSingle();

        if (existingUser) {
          console.log(`User already exists in database: ${owner.email}`);
          results.push({ 
            email: owner.email, 
            success: true, 
            message: 'User already exists in database',
            existing: true 
          });
          continue;
        }

        // Get the Super Admin role
        const { data: superAdminRole } = await supabaseClient
          .from('roles')
          .select('id, name')
          .eq('scope', 'global')
          .is('tenant_id', null)
          .eq('name', 'Super Admin')
          .maybeSingle();

        if (!superAdminRole) {
          console.error('Super Admin role not found');
          results.push({ email: owner.email, success: false, error: 'Super Admin role not found' });
          continue;
        }

        // Create auth user
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: owner.email,
          password: owner.tempPassword,
          email_confirm: true,
          user_metadata: {
            role: 'SUPER_ADMIN',
            role_id: superAdminRole.id,
            scope: 'global',
            tenant_id: null
          }
        });

        if (authError) {
          console.error(`Auth user creation error for ${owner.email}:`, authError);
          results.push({ email: owner.email, success: false, error: authError.message });
          continue;
        }

        if (!authUser?.user?.id) {
          console.error(`Auth returned no user for ${owner.email}`);
          results.push({ email: owner.email, success: false, error: 'Auth did not return user' });
          continue;
        }

        // Create user profile
        const { error: userInsertError } = await supabaseClient.from('users').insert({
          id: authUser.user.id,
          email: owner.email,
          name: owner.name,
          role: 'SUPER_ADMIN',
          role_id: superAdminRole.id,
          tenant_id: null,
          force_reset: true,
          is_active: true,
          is_platform_owner: true
        });

        if (userInsertError) {
          console.error(`Failed to create user profile for ${owner.email}:`, userInsertError);
          // Cleanup auth user on failure
          try {
            await supabaseClient.auth.admin.deleteUser(authUser.user.id);
            console.log(`Cleaned up auth user for ${owner.email}`);
          } catch (e) {
            console.error(`Cleanup failed for ${owner.email}:`, e);
          }
          results.push({ email: owner.email, success: false, error: userInsertError.message });
          continue;
        }

        console.log(`Successfully created system owner: ${owner.email}`);
        results.push({ 
          email: owner.email, 
          success: true, 
          user_id: authUser.user.id,
          tempPassword: owner.tempPassword,
          message: 'System owner created successfully'
        });

      } catch (error: any) {
        console.error(`Unexpected error for ${owner.email}:`, error);
        results.push({ email: owner.email, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'System owner creation operation completed',
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Unexpected error in create-system-owners function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});