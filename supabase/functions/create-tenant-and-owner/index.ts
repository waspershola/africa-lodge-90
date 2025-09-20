import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTenantAndOwnerRequest {
  hotel_name: string;
  hotel_slug: string;
  owner_email: string;
  owner_name: string;
  plan_id: string;
  city?: string;
  address?: string;
  phone?: string;
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const data: CreateTenantAndOwnerRequest = await req.json();
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await hashPassword(tempPassword);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('Creating tenant and owner for:', data.hotel_name);

    // Step 1: Create tenant record
    const tenantData = {
      hotel_name: data.hotel_name,
      hotel_slug: data.hotel_slug,
      plan_id: data.plan_id,
      subscription_status: 'trialing',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      setup_completed: false,
      onboarding_step: 'hotel_information',
      city: data.city || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.owner_email,
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      country: 'Nigeria',
      settings: {},
      brand_colors: {}
    };

    const { data: tenant, error: tenantError } = await supabaseServiceRole
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    if (tenantError) throw new Error(`Failed to create tenant: ${tenantError.message}`);

    console.log('Tenant created:', tenant.tenant_id);

    try {
      // Step 2: Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseServiceRole.auth.admin.createUser({
        email: data.owner_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: data.owner_name,
          role: 'OWNER',
          tenant_id: tenant.tenant_id
        }
      });

      if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);

      console.log('Auth user created:', authUser.user.id);

      try {
        // Step 3: Create user record in users table
        const { error: userError } = await supabaseServiceRole
          .from('users')
          .insert({
            id: authUser.user.id,
            email: data.owner_email,
            name: data.owner_name,
            role: 'OWNER',
            tenant_id: tenant.tenant_id,
            force_reset: true,
            temp_password_hash: tempPasswordHash,
            temp_expires: tempExpires.toISOString(),
            is_active: true
          });

        if (userError) throw new Error(`Failed to create user record: ${userError.message}`);

        console.log('User record created');

        // Step 4: Update tenant with owner_id
        const { error: updateError } = await supabaseServiceRole
          .from('tenants')
          .update({ owner_id: authUser.user.id } as any)
          .eq('tenant_id', tenant.tenant_id);

        if (updateError) throw new Error(`Failed to update tenant owner: ${updateError.message}`);

        console.log('Tenant updated with owner_id');

        // Step 5: Send temporary password email
        try {
          const emailResponse = await resend.emails.send({
            from: "Hotel SaaS <onboarding@resend.dev>",
            to: [data.owner_email],
            subject: `Welcome to Hotel SaaS - Your ${data.hotel_name} account is ready!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1a202c; margin-bottom: 10px;">Welcome to Hotel SaaS!</h1>
                  <p style="color: #718096; font-size: 16px;">Your ${data.hotel_name} management system is ready</p>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #2d3748; margin-top: 0;">Your Account Details</h2>
                  <p style="margin: 10px 0;"><strong>Hotel:</strong> ${data.hotel_name}</p>
                  <p style="margin: 10px 0;"><strong>Email:</strong> ${data.owner_email}</p>
                  <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
                </div>
                
                <div style="background: #fed7d7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #c53030; font-weight: 600;">⚠️ Important Security Notice</p>
                  <p style="margin: 10px 0 0 0; color: #742a2a;">This is a temporary password that expires in 24 hours. You must change it on first login for security purposes.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || ''}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Login to Your Dashboard
                  </a>
                </div>
                
                <div style="margin-top: 30px;">
                  <h3 style="color: #2d3748;">Next Steps:</h3>
                  <ol style="color: #4a5568; padding-left: 20px;">
                    <li>Click the login button above</li>
                    <li>Use the temporary password to sign in</li>
                    <li>You'll be prompted to create a new secure password</li>
                    <li>Complete your hotel setup through the onboarding wizard</li>
                    <li>Start managing your hotel operations!</li>
                  </ol>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
                  <p>Need help? Reply to this email or contact our support team.</p>
                  <p style="margin: 5px 0 0 0;">This email was sent because a Hotel SaaS account was created for ${data.hotel_name}.</p>
                </div>
              </div>
            `,
          });

          console.log("Email sent successfully:", emailResponse);

        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Don't throw here as the tenant/user creation was successful
        }

        return new Response(JSON.stringify({ 
          success: true, 
          tenant,
          message: 'Tenant and owner created successfully! Temporary password sent via email.'
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });

      } catch (error) {
        // Rollback: Delete auth user
        await supabaseServiceRole.auth.admin.deleteUser(authUser.user.id);
        throw error;
      }

    } catch (error) {
      // Rollback: Delete tenant
      await supabaseServiceRole.from('tenants').delete().eq('tenant_id', tenant.tenant_id);
      throw error;
    }

  } catch (error: any) {
    console.error("Error in create-tenant-and-owner function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);