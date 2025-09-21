import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTenantRequest {
  hotel_name: string;
  owner_name: string;
  email: string;
  city?: string;
  phone?: string;
  password: string;
}

// Generate secure temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Hash password for storage
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hotel_saas_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (server-side only)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // This is a public signup endpoint - no authentication required
    console.log('Processing public signup request...');

    const requestData: CreateTenantRequest = await req.json();
    
    console.log('Creating tenant and owner:', {
      hotel_name: requestData.hotel_name,
      email: requestData.email
    });

    // Get default plan
    const { data: defaultPlan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .limit(1)
      .single();
      
    const planId = defaultPlan?.id || '550e8400-e29b-41d4-a716-446655440000'; // fallback plan ID

    // Check if user already exists with this email in public.users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', requestData.email)
      .single();

    if (existingUser) {
      console.log('User already exists in users table:', requestData.email);
      return new Response(
        JSON.stringify({
          error: `A user with email ${requestData.email} already exists`,
          success: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check if user already exists with this email in auth
    const { data: existingAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({
          error: 'Failed to check existing users',
          success: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const userAlreadyExists = existingAuthUsers?.users?.find(u => u.email === requestData.email);
    if (userAlreadyExists) {
      console.log('User already exists in auth:', requestData.email);
      return new Response(
        JSON.stringify({
          error: `A user with email ${requestData.email} already exists`,
          success: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Use provided password instead of generating temporary one
    const userPassword = requestData.password;

    let tenantId: string;
    let authUserId: string;

    try {
      // Step 1: Create tenant record
      const hotel_slug = requestData.hotel_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const tenantData = {
        hotel_name: requestData.hotel_name,
        hotel_slug: hotel_slug,
        plan_id: planId,
        subscription_status: 'trialing',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        setup_completed: false,
        onboarding_step: 'hotel_information',
        city: requestData.city || '',
        phone: requestData.phone || '',
        email: requestData.email,
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        country: 'Nigeria',
        settings: {},
        brand_colors: {}
      };

      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert(tenantData)
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant creation error:', tenantError);
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      tenantId = tenant.tenant_id;
      console.log('Tenant created:', tenantId);

      try {
        // Step 2: Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: requestData.email,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            name: requestData.owner_name,
            role: 'OWNER',
            tenant_id: tenantId
          }
        });

        if (authError) {
          console.error('Auth user creation error:', authError);
          throw new Error(`Failed to create auth user: ${authError.message}`);
        }

        authUserId = authUser.user.id;
        console.log('Auth user created:', authUserId);

        try {
          // Step 3: Check if user record already exists in users table
          const { data: existingUserRecord } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', authUserId)
            .single();

          if (existingUserRecord) {
            console.log('User record already exists, updating with temp password');
            // Update existing user record
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                force_reset: false,
                temp_password_hash: null,
                temp_expires: null,
              })
              .eq('id', authUserId);

            if (updateError) {
              console.error('User record update error:', updateError);
              throw new Error(`Failed to update user record: ${updateError.message}`);
            }

            console.log('User record updated with temp password');
          } else {
            // Create user record in users table
            const { error: userError } = await supabaseAdmin
              .from('users')
              .insert({
                id: authUserId,
                email: requestData.email,
                name: requestData.owner_name,
                role: 'OWNER',
                tenant_id: tenantId,
                force_reset: false,
                temp_password_hash: null,
                temp_expires: null,
                is_active: true
              });

            if (userError) {
              console.error('User record creation error:', userError);
              throw new Error(`Failed to create user record: ${userError.message}`);
            }

            console.log('User record created');
          }

          // Step 5: Update tenant with owner_id
          const { error: updateError } = await supabaseAdmin
            .from('tenants')
            .update({ owner_id: authUserId } as any)
            .eq('tenant_id', tenantId);

          if (updateError) {
            console.error('Tenant update error:', updateError);
            throw new Error(`Failed to update tenant owner: ${updateError.message}`);
          }

          console.log('Tenant updated with owner_id');

          // Note: No welcome email needed for regular signup

          return new Response(
            JSON.stringify({
              success: true,
              tenant,
              owner_id: authUserId,
              message: 'Account created successfully! You can now sign in.'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );

        } catch (error) {
          // Rollback: Delete auth user
          console.log('Rolling back auth user...');
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
            console.log('Auth user deleted successfully');
          } catch (deleteError) {
            console.error('Failed to delete auth user during rollback:', deleteError);
          }
          throw error;
        }

      } catch (error) {
        // Rollback: Delete tenant
        console.log('Rolling back tenant...');
        try {
          await supabaseAdmin.from('tenants').delete().eq('tenant_id', tenantId);
          console.log('Tenant deleted successfully');
        } catch (deleteError) {
          console.error('Failed to delete tenant during rollback:', deleteError);
        }
        throw error;
      }

    } catch (error) {
      console.error('Tenant and owner creation failed:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in create-tenant-and-owner function:', error);
    
    // Provide more specific error information
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Map specific errors to appropriate status codes
      if (error.message.includes('authorization') || error.message.includes('authentication')) {
        statusCode = 401;
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        statusCode = 403;
      } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        statusCode = 400;
      }
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
        debug: {
          timestamp: new Date().toISOString(),
          error_type: error.constructor.name,
          stack: error instanceof Error ? error.stack : undefined
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});