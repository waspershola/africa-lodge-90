import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserRequest {
  email: string;
  name: string;
  role: string;
  tenant_id?: string;
  department?: string;
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
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the caller is authenticated and is a super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role key to verify the token and get user
    const { data: authResult, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    console.log('Auth check result:', { user: !!authResult?.user, error: !!authError });

    if (authError || !authResult?.user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = authResult.user;

    // Check if caller is super admin or owner/manager
    const { data: callerData } = await supabaseAdmin
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    console.log('Caller permissions check:', { callerData });

    if (!callerData || (callerData.role !== 'SUPER_ADMIN' && !['OWNER', 'MANAGER'].includes(callerData.role))) {
      console.error('Insufficient permissions:', callerData);
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, name, role, tenant_id, department }: InviteUserRequest = await req.json();

    console.log('Starting invite-user function with body:', {
      email,
      name,
      role,
      tenant_id,
      department
    });

    // Validate required fields
    if (!email || !name || !role) {
      console.error('Missing required fields:', { email: !!email, name: !!name, role: !!role });
      return new Response(JSON.stringify({ error: 'Email, name, and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersList?.users?.find(u => u.email === email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await hashPassword(tempPassword);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user in Supabase Auth (unverified)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // Don't require email confirmation
      user_metadata: {
        role,
        tenant_id,
        name
      }
    });

    if (createError || !newUser.user) {
      console.error('Failed to create auth user:', createError);
      return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert user into public.users table
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email,
        name,
        role,
        tenant_id: tenant_id || null,
        department,
        force_reset: true,
        temp_password_hash: tempPasswordHash,
        temp_expires: tempExpires.toISOString()
      });

    if (userInsertError) {
      console.error('Failed to create user record:', userInsertError);
      // Clean up auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: 'Failed to create user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to send invitation email
    let emailSent = false;
    let emailError = null;

    try {
      const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app`;
      
      const emailResult = await resend.emails.send({
        from: 'LuxuryHotelSaaS <noreply@mail.luxuryhotelsaas.com>',
        to: [email],
        subject: 'Welcome to LuxuryHotelSaaS - Your Account is Ready',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Welcome to LuxuryHotelSaaS!</h1>
            <p>Hello ${name},</p>
            <p>Your account has been created with the role: <strong>${role}</strong></p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Login Details:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
            </div>
            
            <p><strong>Important:</strong> You must change this password on your first login. This temporary password expires in 24 hours.</p>
            
            <a href="${loginUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Login to Your Account
            </a>
            
            <p>If you have any questions, please contact your administrator.</p>
            <p>Best regards,<br>The LuxuryHotelSaaS Team</p>
          </div>
        `,
      });

      console.log('Email sent successfully:', emailResult);
      emailSent = true;
    } catch (error) {
      console.error('Failed to send email:', error);
      emailError = error.message;
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: user.id,
        action: 'user_invited',
        resource_type: 'user',
        resource_id: newUser.user.id,
        description: `Invited user ${email} with role ${role}`,
        metadata: {
          email,
          role,
          tenant_id,
          department,
          email_sent: emailSent
        }
      });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.user.id,
        email,
        name,
        role
      },
      email_sent: emailSent,
      temp_password: emailSent ? null : tempPassword, // Only return password if email failed
      message: emailSent 
        ? 'User invited successfully! Invitation email sent.'
        : `User created but email failed to send. Temporary password: ${tempPassword}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in invite-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);