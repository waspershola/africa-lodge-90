import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { hotel_name, owner_email, owner_name, city, country, phone }: TrialSignupRequest = await req.json();

    console.log('Starting trial signup:', { hotel_name, owner_email, owner_name });

    // Validate required fields
    if (!hotel_name || !owner_email || !owner_name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Hotel name, owner email, and owner name are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === owner_email);
    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'A user with this email already exists' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the Starter plan (use existing plan instead of Basic)
    const { data: starterPlan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('name', 'Starter')
      .single();

    if (!starterPlan) {
      console.error('Starter plan not found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Trial plan not available' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate hotel slug
    const hotel_slug = hotel_name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await hashPassword(tempPassword);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let tenantId: string;
    let authUserId: string;

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
        .single();

      if (tenantError) {
        console.error('Tenant creation error:', tenantError);
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
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
        password: tempPassword,
        email_confirm: false,
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

      // Step 3: Get Owner role for this tenant
      const { data: ownerRole, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'Owner')
        .eq('scope', 'tenant')
        .eq('tenant_id', tenantId)
        .single();

      if (roleError || !ownerRole) {
        console.error('Failed to find Owner role for tenant:', roleError);
        throw new Error('Owner role not found for tenant');
      }

      // Step 4: Create user record
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUserId,
          email: owner_email,
          name: owner_name,
          role: 'OWNER',
          role_id: ownerRole.id,
          tenant_id: tenantId,
          force_reset: true,
          temp_password_hash: tempPasswordHash,
          temp_expires: tempExpires.toISOString(),
          is_active: true
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

      // Step 6: Send welcome email
      let emailSent = false;
      try {
        const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app`;
        
        const emailResult = await resend.emails.send({
          from: 'LuxuryHotelSaaS <noreply@mail.luxuryhotelsaas.com>',
          to: [owner_email],
          subject: 'Welcome to Your 14-Day Free Trial!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1f2937;">Welcome to LuxuryHotelSaaS!</h1>
              <p>Hello ${owner_name},</p>
              <p>Your 14-day free trial for <strong>${hotel_name}</strong> has been activated!</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Your Login Details:</h3>
                <p><strong>Email:</strong> ${owner_email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              </div>
              
              <p><strong>Important:</strong> You must change this password on your first login.</p>
              
              <a href="${loginUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Start Your Trial
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
              <p>Best regards,<br>The LuxuryHotelSaaS Team</p>
            </div>
          `,
        });

        console.log('Welcome email sent successfully:', emailResult);
        emailSent = true;
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }

      return new Response(JSON.stringify({
        success: true,
        tenant,
        email_sent: emailSent,
        temp_password: emailSent ? null : tempPassword,
        message: emailSent 
          ? 'Trial account created successfully! Welcome email sent.'
          : `Trial account created. Temporary password: ${tempPassword}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Rollback: Clean up tenant and auth user if created
      if (tenantId) {
        try {
          await supabaseAdmin.from('tenants').delete().eq('tenant_id', tenantId);
          console.log('Tenant rolled back');
        } catch (rollbackError) {
          console.error('Failed to rollback tenant:', rollbackError);
        }
      }
      
      if (authUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          console.log('Auth user rolled back');
        } catch (rollbackError) {
          console.error('Failed to rollback auth user:', rollbackError);
        }
      }
      
      throw error;
    }

  } catch (error: any) {
    console.error('Error in trial-signup function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Trial signup failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);