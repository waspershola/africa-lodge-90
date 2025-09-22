import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuspendUserRequest {
  user_id: string;
  reason?: string;
  suspend: boolean; // true = suspend, false = unsuspend
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const operationId = crypto.randomUUID();
  
  console.log(`[${operationId}] suspend-user function started`, { timestamp: new Date().toISOString() });
  
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

    if (authError || !authResult?.user) {
      console.error(`[${operationId}] Auth error:`, authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = authResult.user;

    // Check if caller is super admin
    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('role, tenant_id, email')
      .eq('id', user.id)
      .maybeSingle();

    if (callerError) {
      console.error(`[${operationId}] Failed to fetch caller data:`, callerError);
      return new Response(JSON.stringify({ error: 'Failed to verify user permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!callerData || callerData.role !== 'SUPER_ADMIN') {
      console.error(`[${operationId}] Insufficient permissions:`, callerData);
      return new Response(JSON.stringify({ error: 'Only super admins can suspend/unsuspend users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, reason, suspend }: SuspendUserRequest = await req.json();

    console.log(`[${operationId}] Processing suspend request:`, {
      user_id,
      suspend,
      reason,
      caller: callerData.email
    });

    // Validate required fields
    if (!user_id) {
      console.error(`[${operationId}] Missing user_id`);
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if target user exists and get their info
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active, is_platform_owner, tenant_id')
      .eq('id', user_id)
      .maybeSingle();

    if (targetUserError || !targetUser) {
      console.error(`[${operationId}] Target user not found:`, targetUserError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent suspending platform owner
    if (targetUser.is_platform_owner && suspend) {
      console.error(`[${operationId}] Attempted to suspend platform owner`);
      return new Response(JSON.stringify({ error: 'Cannot suspend platform owner' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent self-suspension
    if (user_id === user.id && suspend) {
      console.error(`[${operationId}] User attempted to suspend themselves`);
      return new Response(JSON.stringify({ error: 'Cannot suspend your own account' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${operationId}] Target user found:`, {
      email: targetUser.email,
      role: targetUser.role,
      current_status: targetUser.is_active
    });

    // Update user status in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_active: !suspend, // suspend=true means is_active=false
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error(`[${operationId}] Failed to update user status:`, updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update user status',
        details: updateError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to suspend/unsuspend auth session (this may not be available in all Supabase versions)
    let authActionResult = null;
    try {
      if (suspend) {
        // For suspension, we could optionally sign out all sessions
        console.log(`[${operationId}] Note: Auth session management not implemented - user can still login but is_active=false will prevent access`);
        authActionResult = 'User marked as inactive in database';
      } else {
        console.log(`[${operationId}] User unsuspended and can now login normally`);
        authActionResult = 'User reactivated in database';
      }
    } catch (authError) {
      console.warn(`[${operationId}] Auth action failed (this is non-fatal):`, authError);
      authActionResult = 'Database updated, auth session unchanged';
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: user.id,
        action: suspend ? 'user_suspended' : 'user_unsuspended',
        resource_type: 'user',
        resource_id: user_id,
        description: `User ${targetUser.email} ${suspend ? 'suspended' : 'unsuspended'} by ${callerData.email}`,
        metadata: {
          target_email: targetUser.email,
          target_role: targetUser.role,
          reason: reason || 'No reason provided',
          auth_action_result: authActionResult
        }
      });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`[${operationId}] suspend-user function completed successfully`, {
      duration_ms: duration,
      action: suspend ? 'suspended' : 'unsuspended',
      target_user: targetUser.email
    });

    return new Response(JSON.stringify({
      success: true,
      message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        is_active: !suspend
      },
      auth_action: authActionResult,
      debug_info: {
        operation_id: operationId,
        duration_ms: duration
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`[${operationId}] Error in suspend-user function:`, {
      error: error.message,
      stack: error.stack,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error',
      debug_info: {
        operation_id: operationId,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);