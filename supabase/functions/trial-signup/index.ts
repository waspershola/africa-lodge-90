import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "https://esm.sh/resend@2.0.0";

// Defensive initialization - don't fail on module load if RESEND_API_KEY is missing
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
let resend: Resend | null = null;

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
  console.log('[trial-signup] Resend initialized successfully');
} else {
  console.warn('[trial-signup] RESEND_API_KEY not configured - emails will not be sent');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrialSignupRequest {
  hotel_name: string;
  owner_email: string;
  owner_name: string;
  city?: string;
  country?: string;
  phone?: string;
  password: string;
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
  
  console.log(`[${operationId}] trial-signup function started`, { timestamp: new Date().toISOString() });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { hotel_name, owner_email, owner_name, city, country, phone, password }: TrialSignupRequest = await req.json();

    console.log('Starting trial signup:', { hotel_name, owner_email, owner_name });

    // Validate required fields
    if (!hotel_name || !owner_email || !owner_name || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Hotel name, owner email, owner name, and password are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists in auth or public users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email === owner_email);
    
    // Also check public users table
    const { data: existingPublicUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', owner_email)
      .maybeSingle();
    
    if (existingAuthUser || existingPublicUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'A user with this email already exists. Please use a different email or try signing in.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the Starter plan (case-insensitive)
    console.log(`[${operationId}] Looking up Starter plan...`);
    const { data: starterPlan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id, name')
      .ilike('name', 'Starter')
      .maybeSingle();

    if (planError) {
      console.error(`[${operationId}] Plan lookup error:`, planError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Database error looking up plan: ${planError.message}`,
        debug_info: {
          operation_id: operationId,
          error_details: planError
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!starterPlan) {
      console.log(`[${operationId}] Starter plan not found, checking available plans...`);
      const { data: allPlans, error: allPlansError } = await supabaseAdmin.from('plans').select('name, id');
      console.log(`[${operationId}] Available plans:`, allPlans);
      
      if (allPlansError) {
        console.error(`[${operationId}] Error fetching all plans:`, allPlansError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to fetch available plans: ${allPlansError.message}`,
          debug_info: {
            operation_id: operationId
          }
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Try to find any plan that looks like a starter/trial plan (case-insensitive)
      const fallbackPlan = allPlans?.find(p => 
        p.name.toLowerCase().includes('starter') ||
        p.name.toLowerCase().includes('trial') ||
        p.name.toLowerCase().includes('basic')
      );
      
      if (fallbackPlan) {
        console.log(`[${operationId}] Using fallback plan: ${fallbackPlan.name}`);
        // Assign the found plan data
        Object.assign(starterPlan || {}, { id: fallbackPlan.id, name: fallbackPlan.name });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `No suitable plan found. Available plans: ${allPlans?.map(p => p.name).join(', ') || 'none'}`,
          debug_info: {
            operation_id: operationId,
            available_plans: allPlans
          }
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`[${operationId}] Found plan: ${starterPlan?.name} with ID: ${starterPlan?.id}`);

    // Generate hotel slug
    const hotel_slug = hotel_name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    if (!starterPlan) {
      console.error('Failed to find starter plan');
      return new Response(JSON.stringify({ 
        error: 'Service configuration error',
        details: 'Starter plan not found' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use provided password
    const userPassword = password;
    const tempPasswordHash = await hashPassword(password); // For backup reference
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let tenantId: string | undefined;
    let authUserId: string | undefined;

    try {
      // Step 1: Create tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          hotel_name,
          hotel_slug,
          plan_id: starterPlan.id,
          subscription_status: 'trialing',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          setup_completed: false,
          onboarding_step: 'hotel_information',
          city: city || '',
          country: country || 'Nigeria',
          phone: phone || '',
          email: owner_email,
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          settings: {},
          brand_colors: {}
        })
        .select()
        .maybeSingle();

      if (tenantError || !tenant) {
        console.error('Tenant creation error:', tenantError);
        throw new Error(`Failed to create tenant: ${tenantError?.message || 'No tenant returned'}`);
      }

      tenantId = tenant.tenant_id;
      console.log('Tenant created:', tenantId);

      // Create default roles for this tenant
      const { error: defaultRolesError } = await supabaseAdmin.rpc('create_default_tenant_roles', {
        tenant_uuid: tenantId
      });

      if (defaultRolesError) {
        console.error('Failed to create default roles:', defaultRolesError);
        throw new Error(`Failed to create default tenant roles: ${defaultRolesError.message}`);
      }

      // Step 2: Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: owner_email,
        password: userPassword, // Use the user's chosen password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: owner_name,
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

      // Step 3: Get Owner role for this tenant (case-insensitive)
      const { data: ownerRole, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .ilike('name', 'Owner')
        .eq('scope', 'tenant')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (roleError || !ownerRole) {
        console.error(`[${operationId}] Failed to find Owner role for tenant:`, roleError);
        // Get available roles for debugging
        const { data: availableRoles } = await supabaseAdmin
          .from('roles')
          .select('name, scope, tenant_id')
          .eq('scope', 'tenant')
          .eq('tenant_id', tenantId);
        console.log(`[${operationId}] Available tenant roles:`, availableRoles);
        throw new Error(`Owner role not found for tenant ${tenantId}. Available roles: ${availableRoles?.map(r => r.name).join(', ') || 'none'}`);
      }

      // Step 4: Create user record (with upsert to handle duplicates)
      const { error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authUserId,
          email: owner_email,
          name: owner_name,
          role: 'OWNER',
          role_id: ownerRole.id,
          tenant_id: tenantId,
          force_reset: false, // No need to force password reset since they set their own
          temp_password_hash: null, // No temporary password needed
          temp_expires: null,
          is_active: true
        }, {
          onConflict: 'id'
        });

      if (userError) {
        console.error('User record creation error:', userError);
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // Step 5: Update tenant with owner_id
      const { error: updateError } = await supabaseAdmin
        .from('tenants')
        .update({ owner_id: authUserId })
        .eq('tenant_id', tenantId);

      if (updateError) {
        console.error('Tenant update error:', updateError);
        throw new Error(`Failed to update tenant owner: ${updateError.message}`);
      }

      // Step 6: Send welcome email (non-critical - don't fail if this fails)
      let emailSent = false;
      let emailError = null;
      
      try {
        // Only attempt email if resend is configured
        if (!resend) {
          console.warn('[trial-signup] Skipping email - Resend not configured');
          emailError = 'Email service not configured';
        } else {
          const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app`;
          
          const emailResult = await resend.emails.send({
          from: 'LUXURYHOTELPRO <noreply@mail.luxuryhotelpro.com>',
          to: [owner_email],
          subject: 'Welcome to Your 14-Day Free Trial!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1f2937;">Welcome to LUXURYHOTELPRO!</h1>
              <p>Hello ${owner_name},</p>
              <p>Your 14-day free trial for <strong>${hotel_name}</strong> has been activated!</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Your Login Details:</h3>
                <p><strong>Email:</strong> ${owner_email}</p>
                <p><strong>Password:</strong> Use the password you just created during signup</p>
              </div>
              
              <a href="${loginUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Start Your Trial Now
              </a>
              
              <p>Your trial includes:</p>
              <ul>
                <li>Full hotel management system</li>
                <li>Room reservations and check-ins</li>
                <li>Staff management</li>
                <li>Basic reporting</li>
                <li>Email support</li>
              </ul>
              
              <p>Questions? Reply to this email or contact our support team.</p>
              <p>Best regards,<br>The LUXURYHOTELPRO Team</p>
            </div>
          `,
          });

          console.log('Welcome email sent successfully:', emailResult);
          emailSent = true;
        }
      } catch (error) {
        console.error('Failed to send welcome email (non-critical):', error);
        emailError = (error as Error).message;
        // Continue anyway - email failure shouldn't break trial signup
      }

      // Log audit event for trial signup
      await supabaseAdmin
        .from('audit_log')
        .insert({
          actor_id: authUserId,
          action: 'trial_signup_completed',
          resource_type: 'tenant',
          resource_id: tenantId,
          description: `Trial signup completed for ${hotel_name}`,
          metadata: {
            hotel_name,
            owner_email,
            plan_id: starterPlan.id,
            email_sent: emailSent,
            email_error: emailError
          }
        });

      console.log(`[${operationId}] Trial signup completed successfully`, {
        tenant_id: tenantId,
        user_id: authUserId,
        email_sent: emailSent,
        duration_ms: Date.now() - startTime
      });

      return new Response(JSON.stringify({
        success: true,
        error_code: null,
        tenant: {
          id: tenantId,
          hotel_name,
          plan_id: starterPlan.id,
          subscription_status: 'trialing'
        },
        user: {
          id: authUserId,
          email: owner_email,
          name: owner_name
        },
        email_sent: emailSent,
        message: emailSent 
          ? 'Trial account created successfully! Welcome email sent.'
          : 'Trial account created successfully! You can now sign in.',
        debug_info: {
          operation_id: operationId,
          duration_ms: Date.now() - startTime,
          email_error: emailError
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Trial signup error during transaction:', error);
      
      // Rollback: Clean up in reverse order
      if (authUserId) {
        try {
          // Delete from public.users first
          await supabaseAdmin.from('users').delete().eq('id', authUserId);
          console.log('Public user record rolled back');
          
          // Then delete from auth
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          console.log('Auth user rolled back');
        } catch (rollbackError) {
          console.error('Failed to rollback auth user:', rollbackError);
        }
      }
      
      if (tenantId) {
        try {
          // Delete roles first (if any were created)
          await supabaseAdmin.from('roles').delete().eq('tenant_id', tenantId);
          console.log('Tenant roles rolled back');
          
          // Then delete tenant
          await supabaseAdmin.from('tenants').delete().eq('tenant_id', tenantId);
          console.log('Tenant rolled back');
        } catch (rollbackError) {
          console.error('Failed to rollback tenant:', rollbackError);
        }
      }
      
      throw error;
    }

  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`[${operationId}] Error in trial-signup function:`, {
      error: error.message,
      stack: error.stack,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
    
    // Determine error code for better client handling
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    
    if (error.message?.includes('already exists')) {
      errorCode = 'USER_EXISTS';
      statusCode = 400;
    } else if (error.message?.includes('plan')) {
      errorCode = 'PLAN_NOT_FOUND';
      statusCode = 500;
    } else if (error.message?.includes('tenant')) {
      errorCode = 'TENANT_CREATION_FAILED';
      statusCode = 500;
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error_code: errorCode,
      error: error.message || 'Trial signup failed',
      debug_info: {
        operation_id: operationId,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);