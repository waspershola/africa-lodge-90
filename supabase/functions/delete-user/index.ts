import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token and verify with service role key
    const token = authHeader.replace('Bearer ', '');
    
    // Use service role key to verify the token and get user  
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    console.log('Delete user auth check:', { hasUser: !!user, error: authError?.message });
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is authorized (super admin or owner/manager in same tenant)
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role, tenant_id, is_platform_owner')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Authorization error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = userData?.role === 'SUPER_ADMIN';
    const isOwnerOrManager = userData?.role === 'OWNER' || userData?.role === 'MANAGER';

    if (!isSuperAdmin && !isOwnerOrManager) {
      console.error('Authorization error: insufficient permissions');
      return new Response(
        JSON.stringify({ success: false, error: 'Only owners, managers, or super admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id }: DeleteUserRequest = await req.json();

    if (!user_id) {
      console.error('Missing user_id in request');
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to delete user: ${user_id}`);

    // Check if target user is platform owner or in same tenant
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('users')
      .select('is_platform_owner, email, role, tenant_id')
      .eq('id', user_id)
      .single();

    if (targetUserError) {
      console.error('Error fetching target user:', targetUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found in system' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Target user found: ${targetUser.email} (role: ${targetUser.role})`);

    // Super admins can delete anyone except platform owners
    // Owners/Managers can only delete users in their tenant
    if (!isSuperAdmin) {
      if (!targetUser.tenant_id || targetUser.tenant_id !== userData.tenant_id) {
        console.error('Authorization error: cannot delete user from different tenant');
        return new Response(
          JSON.stringify({ success: false, error: 'Cannot delete user from different tenant' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Owners can delete anyone in their tenant except other owners
      // Managers can only delete staff (not owners or other managers)
      if (userData.role === 'MANAGER' && (targetUser.role === 'OWNER' || targetUser.role === 'MANAGER')) {
        console.error('Authorization error: managers cannot delete owners or other managers');
        return new Response(
          JSON.stringify({ success: false, error: 'Managers cannot delete owners or other managers' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (targetUser.is_platform_owner) {
      console.error('Attempted to delete platform owner');
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete platform owner' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user_id === user.id) {
      console.error('User attempted to delete themselves');
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete your own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // First, nullify audit log references to prevent foreign key constraint violations
      console.log('Nullifying audit log references...');
      const { error: auditUpdateError } = await supabaseClient
        .from('audit_log')
        .update({ actor_id: null })
        .eq('actor_id', user_id);

      if (auditUpdateError) {
        console.warn('Failed to update audit log references:', auditUpdateError);
        // Continue anyway - this is not critical
      }

      // Then, try to delete from users table (this cleans up our records)
      console.log('Deleting user record from database...');
      const { error: deleteUserError } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', user_id);

      if (deleteUserError) {
        console.error('Failed to delete user record:', deleteUserError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to delete user record from database', 
            details: deleteUserError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User record deleted successfully');

      // Then try to delete from Supabase Auth (this might fail if user already deleted)
      console.log('Deleting user from Supabase Auth...');
      const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(user_id);

      if (deleteAuthError) {
        // This is OK if user was already deleted from auth
        if (deleteAuthError.message?.includes('User not found')) {
          console.log('User was already deleted from auth (this is OK)');
        } else {
          console.error('Failed to delete auth user:', deleteAuthError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to delete user from authentication system', 
              details: deleteAuthError.message 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('Auth user deleted successfully');
      }
    } catch (error) {
      console.error('Unexpected error during user deletion:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unexpected error during deletion',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

      // Log audit event
    try {
      await supabaseClient
        .from('audit_log')
        .insert({
          actor_id: user.id,
          action: 'user_deleted',
          resource_type: 'user',
          resource_id: user_id,
          tenant_id: targetUser.tenant_id || userData.tenant_id,
          description: `User ${targetUser.email} deleted by ${userData.role.toLowerCase()} ${user.email}`,
          metadata: {
            target_email: targetUser.email,
            target_role: targetUser.role,
            deleted_by: user.email
          }
        });
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    console.log(`User ${targetUser.email} deleted successfully by ${userData.role.toLowerCase()} ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        deleted_user: {
          email: targetUser.email,
          role: targetUser.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);