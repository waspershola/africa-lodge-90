import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_OWNERS = [
  {
    email: 'wasperstore@gmail.com',
    name: 'Wasper Store Admin',
    role: 'Super Admin'
  },
  {
    email: 'ceo@waspersolution.com',
    name: 'CEO',
    role: 'Super Admin'
  },
  {
    email: 'waspershola@gmail.com',
    name: 'Wasper Shola',
    role: 'Super Admin'
  }
];

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

    console.log('Creating system owners...');
    
    const results = [];
    
    for (const owner of SYSTEM_OWNERS) {
      try {
        // Check if user already exists
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error('Error listing users:', listError);
          continue;
        }

        const existingUser = users.find(u => u.email === owner.email);
        if (existingUser) {
          console.log(`${owner.email} already exists, skipping`);
          results.push({
            email: owner.email,
            status: 'skipped',
            reason: 'already exists'
          });
          continue;
        }

        // Get the Super Admin role
        const { data: roleData, error: roleError } = await supabaseAdmin
          .from('roles')
          .select('id, name')
          .eq('scope', 'global')
          .is('tenant_id', null)
          .ilike('name', 'Super Admin')
          .maybeSingle();

        if (roleError || !roleData) {
          console.error('Super Admin role not found');
          results.push({
            email: owner.email,
            status: 'failed',
            reason: 'Super Admin role not found'
          });
          continue;
        }

        // Generate temporary password
        const tempPassword = 'SysOwner' + Math.random().toString(36).substring(2, 10) + '!';

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: owner.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            role: 'SUPER_ADMIN',
            role_id: roleData.id,
            scope: 'global',
            tenant_id: null
          }
        });

        if (authError) {
          console.error(`Auth user creation error for ${owner.email}:`, authError);
          results.push({
            email: owner.email,
            status: 'failed',
            reason: authError.message
          });
          continue;
        }

        if (!authUser?.user?.id) {
          results.push({
            email: owner.email,
            status: 'failed',
            reason: 'Failed to create auth user'
          });
          continue;
        }

        // Create user profile
        const { error: userInsertError } = await supabaseAdmin.from('users').upsert({
          id: authUser.user.id,
          email: owner.email,
          name: owner.name,
          role: 'SUPER_ADMIN',
          role_id: roleData.id,
          tenant_id: null,
          is_platform_owner: true,
          force_reset: true,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

        if (userInsertError) {
          console.error(`Failed to create user profile for ${owner.email}:`, userInsertError);
          // Cleanup auth user
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          } catch (e) {
            console.error('Cleanup failed:', e);
          }
          results.push({
            email: owner.email,
            status: 'failed',
            reason: 'Failed to create user profile'
          });
          continue;
        }

        console.log(`System owner created successfully: ${owner.email}`);
        results.push({
          email: owner.email,
          status: 'created',
          tempPassword: tempPassword,
          userId: authUser.user.id
        });

      } catch (error: any) {
        console.error(`Error creating ${owner.email}:`, error);
        results.push({
          email: owner.email,
          status: 'failed',
          reason: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'created').length;
    const skipCount = results.filter(r => r.status === 'skipped').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return new Response(JSON.stringify({
      success: true,
      message: `Created ${successCount} owners, skipped ${skipCount}, failed ${failCount}`,
      results: results
    }), {
      status: 200,
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