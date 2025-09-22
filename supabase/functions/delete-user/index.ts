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

    // Check if the user is a super admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role, is_platform_owner')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'SUPER_ADMIN') {
      console.error('Authorization error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Only super admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id }: DeleteUserRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if target user is platform owner
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('users')
      .select('is_platform_owner, email, role')
      .eq('id', user_id)
      .single();

    if (targetUserError) {
      console.error('Error fetching target user:', targetUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found in system' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetUser.is_platform_owner) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete platform owner' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete your own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from auth.users first, then public.users
    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(user_id);
    
    if (deleteAuthError) {
      console.error('Error deleting user from auth:', deleteAuthError);
      return new Response(
        JSON.stringify({ success: false, error: deleteAuthError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also delete from public.users table explicitly
    const { error: deletePublicError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', user_id);
    
    if (deletePublicError) {
      console.error('Error deleting user from public.users:', deletePublicError);
      // Don't return error here as auth user is already deleted
    }

    console.log(`User ${targetUser.email} deleted successfully by super admin ${userData?.role}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully' 
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