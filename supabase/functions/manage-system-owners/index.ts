import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManageSystemOwnersRequest {
  action: 'update_system_owners';
  approved_emails: string[];
  delete_emails?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('System owner management function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user to verify super admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is a super admin
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !userData.user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super admin
    const { data: userRecord, error: userRecordError } = await supabase
      .from('users')
      .select('role, is_platform_owner')
      .eq('id', userData.user.id)
      .single();

    if (userRecordError || userRecord?.role !== 'SUPER_ADMIN') {
      console.error('User not authorized as super admin');
      return new Response(
        JSON.stringify({ success: false, error: 'Only super admins can manage system owners' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, approved_emails, delete_emails }: ManageSystemOwnersRequest = await req.json();

    if (action !== 'update_system_owners') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Use direct Supabase client operations instead of exec function
    console.log('Managing system owners with direct database operations');

    // Remove platform owner status and demote users not in approved list
    let demoteQuery = supabase
      .from('users')
      .update({ is_platform_owner: false, role: 'STAFF' })
      .eq('is_platform_owner', true);

    // Add conditions for each approved email to exclude them
    approved_emails.forEach(email => {
      demoteQuery = demoteQuery.neq('email', email);
    });

    const { data: demotedUsers, error: demoteError } = await demoteQuery.select('email');

    if (demoteError) {
      console.error('Error demoting users:', demoteError);
    } else {
      results.push({ action: 'demoted', users: demotedUsers });
      console.log('Demoted users:', demotedUsers);
    }

    // Delete specific users if provided
    if (delete_emails && delete_emails.length > 0) {
      for (const email of delete_emails) {
        // First delete from auth
        const { data: userToDelete } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (userToDelete) {
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);
          if (authDeleteError) {
            console.error(`Error deleting user from auth: ${email}`, authDeleteError);
          }

          // Delete from users table
          const { error: userDeleteError } = await supabase
            .from('users')
            .delete()
            .eq('email', email);

          if (userDeleteError) {
            console.error(`Error deleting user from users table: ${email}`, userDeleteError);
          } else {
            results.push({ action: 'deleted', email });
            console.log(`Deleted user: ${email}`);
          }
        }
      }
    }

    // Ensure approved emails are system owners with SUPER_ADMIN role
    const { data: promotedUsers, error: promoteError } = await supabase
      .from('users')
      .update({ is_platform_owner: true, role: 'SUPER_ADMIN' })
      .in('email', approved_emails)
      .select('email');

    if (promoteError) {
      console.error('Error promoting users:', promoteError);
    } else {
      results.push({ action: 'promoted', users: promotedUsers });
      console.log('Promoted users:', promotedUsers);
    }

    // Operations completed successfully
    console.log('System owner management completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'System owners updated successfully',
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('System owner management error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Failed to manage system owners' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});