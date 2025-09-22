import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuspendUserRequest {
  user_id: string;
  reason?: string;
  action: 'suspend' | 'unsuspend';
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const operationId = crypto.randomUUID();
  
  console.log(`[${operationId}] suspend-user function started`, { timestamp: new Date().toISOString() });
  
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
      console.error(`[${operationId}] No authorization header provided`);
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the token and get user
    const { data: authResult, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    console.log(`[${operationId}] Auth check result:`, { user: !!authResult?.user, error: !!authError });

    if (authError || !authResult?.user) {
      console.error(`[${operationId}] Auth error:`, authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerUser = authResult.user;

    // Check if caller is super admin or owner/manager
    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('role, tenant_id')
      .eq('id', callerUser.id)
      .maybeSingle();

    if (callerError) {
      console.error(`[${operationId}] Failed to fetch caller data:`, callerError);
      return new Response(JSON.stringify({ error: 'Failed to verify user permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${operationId}] Caller permissions check:`, { callerData });

    if (!callerData || (callerData.role !== 'SUPER_ADMIN' && !['OWNER', 'MANAGER'].includes(callerData.role))) {
      console.error(`[${operationId}] Insufficient permissions:`, callerData);
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, reason, action }: SuspendUserRequest = await req.json();

    console.log(`[${operationId}] Processing ${action} request:`, {
      user_id,
      reason,
      action
    });

    // Validate required fields
    if (!user_id || !action) {
      console.error(`[${operationId}] Missing required fields:`, { user_id: !!user_id, action: !!action });
      return new Response(JSON.stringify({ error: 'User ID and action are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['suspend', 'unsuspend'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Action must be "suspend" or "unsuspend"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user details before suspending
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, tenant_id, is_active')
      .eq('id', user_id)
      .maybeSingle();

    if (userError || !targetUser) {
      console.error(`[${operationId}] Failed to find target user:`, userError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${operationId}] Target user:`, targetUser);

    // Prevent self-suspension
    if (targetUser.id === callerUser.id) {
      return new Response(JSON.stringify({ error: 'Cannot suspend/unsuspend yourself' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent suspending super admins (unless caller is also super admin)
    if (targetUser.role === 'SUPER_ADMIN' && callerData.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: 'Cannot suspend super administrators' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check tenant access for non-super-admin callers
    if (callerData.role !== 'SUPER_ADMIN') {
      if (targetUser.tenant_id !== callerData.tenant_id) {
        return new Response(JSON.stringify({ error: 'Cannot manage users from other tenants' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const newActiveStatus = action === 'unsuspend';
    const isAlreadyInDesiredState = targetUser.is_active === newActiveStatus;

    if (isAlreadyInDesiredState) {
      return new Response(JSON.stringify({ 
        success: true,
        message: `User is already ${action === 'suspend' ? 'suspended' : 'active'}`,
        user: targetUser
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user status in public.users table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: newActiveStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error(`[${operationId}] Failed to update user status:`, updateError);
      return new Response(JSON.stringify({ 
        error: `Failed to ${action} user`,
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: callerUser.id,
        action: `user_${action}ed`,
        resource_type: 'user',
        resource_id: user_id,
        description: `${action === 'suspend' ? 'Suspended' : 'Unsuspended'} user ${targetUser.email}${reason ? `: ${reason}` : ''}`,
        metadata: {
          target_email: targetUser.email,
          target_role: targetUser.role,
          reason
        }
      });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`[${operationId}] suspend-user function completed successfully`, {
      duration_ms: duration,
      action,
      user_id
    });

    return new Response(JSON.stringify({
      success: true,
      message: `User ${action === 'suspend' ? 'suspended' : 'unsuspended'} successfully`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        is_active: newActiveStatus
      },
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