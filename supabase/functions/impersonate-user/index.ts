import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImpersonateRequest {
  user_id: string;
  reason: string;
  duration?: number; // in minutes, default 60
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
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

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify super admin permissions
    const { data: adminData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminData || adminData.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: 'Only Super Admins can impersonate users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, reason, duration = 60 }: ImpersonateRequest = await req.json();

    if (!user_id || !reason) {
      return new Response(JSON.stringify({ error: 'user_id and reason are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify target user exists
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    // Create impersonation record
    const { data: impersonation, error: impersonationError } = await supabaseAdmin
      .from('impersonations')
      .insert({
        original_user_id: user.id,
        impersonated_user_id: user_id,
        reason,
        session_token: sessionToken,
      })
      .select('*')
      .single();

    if (impersonationError) {
      console.error('Failed to create impersonation record:', impersonationError);
      return new Response(JSON.stringify({ error: 'Failed to create impersonation session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create JWT for impersonated user
    const { data: authData, error: jwtError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email,
    });

    if (jwtError || !authData.properties?.action_link) {
      console.error('Failed to generate auth link:', jwtError);
      return new Response(JSON.stringify({ error: 'Failed to generate impersonation token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: user.id,
        action: 'impersonation_started',
        resource_type: 'user',
        resource_id: user_id,
        description: `Started impersonating ${targetUser.email}`,
        metadata: {
          target_user_email: targetUser.email,
          target_user_role: targetUser.role,
          reason,
          session_token: sessionToken,
          duration_minutes: duration
        }
      });

    return new Response(JSON.stringify({
      success: true,
      impersonation_id: impersonation.id,
      session_token: sessionToken,
      target_user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role
      },
      expires_at: expiresAt.toISOString(),
      auth_url: authData.properties.action_link
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in impersonate-user function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);