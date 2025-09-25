import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = crypto.randomUUID().substring(0, 8);
  console.log(`[${operationId}] Delete user function started`);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${operationId}] No authorization header`);
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[${operationId}] Authentication failed:`, authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is authorized
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, tenant_id, is_platform_owner')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error(`[${operationId}] User lookup failed:`, userError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = userData?.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin) {
      console.error(`[${operationId}] Insufficient permissions`);
      return new Response(
        JSON.stringify({ success: false, error: 'Only super admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id }: DeleteUserRequest = await req.json();

    if (!user_id) {
      console.error(`[${operationId}] Missing user_id`);
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${operationId}] Attempting to delete user: ${user_id}`);

    // Get target user info
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('is_platform_owner, email, role, tenant_id, force_reset')
      .eq('id', user_id)
      .single();

    if (targetUserError) {
      console.error(`[${operationId}] Target user not found:`, targetUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${operationId}] Target user: ${targetUser.email} (role: ${targetUser.role})`);

    // Protect platform owners (unless they have force_reset)
    if (targetUser.is_platform_owner && !targetUser.force_reset) {
      console.error(`[${operationId}] Cannot delete active platform owner`);
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete platform owner' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user_id === user.id) {
      console.error(`[${operationId}] Self-deletion attempt`);
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete your own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Delete from users table first
      console.log(`[${operationId}] Deleting user record from database...`);
      const { error: deleteUserError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', user_id);

      if (deleteUserError) {
        console.error(`[${operationId}] Failed to delete user record:`, deleteUserError);
        
        // Check if it's a platform owner protection error
        if (deleteUserError.message?.includes('Platform owner cannot be deleted')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Cannot delete platform owner',
              details: 'Platform owners cannot be deleted for security reasons'
            }),
            { 
              status: 400, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to delete user from database',
            details: deleteUserError.message || 'Unknown database error'
          }),
          { 
            status: 500, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Then delete from Supabase Auth
      console.log(`[${operationId}] Deleting user from auth...`);
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

      if (deleteAuthError && !deleteAuthError.message?.includes('User not found')) {
        console.error(`[${operationId}] Failed to delete auth user:`, deleteAuthError);
        // Don't fail the entire operation for this
      }

      // Log audit event
      try {
        await supabaseAdmin
          .from('audit_log')
          .insert({
            actor_id: user.id,
            action: 'user_deleted',
            resource_type: 'user',
            resource_id: user_id,
            tenant_id: targetUser.tenant_id,
            description: `User ${targetUser.email} deleted`,
            metadata: {
              target_email: targetUser.email,
              target_role: targetUser.role,
              deleted_by: user.email
            }
          });
      } catch (auditError) {
        console.warn(`[${operationId}] Failed to log audit event:`, auditError);
      }

      console.log(`[${operationId}] User deleted successfully`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User deleted successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error(`[${operationId}] Unexpected error during deletion:`, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to delete user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error(`[${operationId}] Error in delete-user function:`, error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});