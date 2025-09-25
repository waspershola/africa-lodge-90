import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    // Temporarily drop the trigger to allow changes
    console.log('Temporarily dropping platform owner protection trigger');
    await supabase.rpc('exec', {
      sql: `DROP TRIGGER IF EXISTS prevent_platform_owner_changes ON public.users;`
    });

    // Remove platform owner status and demote users not in approved list
    const { data: demotedUsers, error: demoteError } = await supabase.rpc('exec', {
      sql: `
        UPDATE public.users 
        SET is_platform_owner = false, role = 'STAFF' 
        WHERE email NOT IN ($1, $2, $3) 
        AND is_platform_owner = true 
        RETURNING email;
      `,
      args: [approved_emails[0], approved_emails[1] || '', approved_emails[2] || '']
    });

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

          // Delete from users table using raw SQL to bypass RLS
          const { error: userDeleteError } = await supabase.rpc('exec', {
            sql: `DELETE FROM public.users WHERE email = $1`,
            args: [email]
          });

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
    const { data: promotedUsers, error: promoteError } = await supabase.rpc('exec', {
      sql: `
        UPDATE public.users 
        SET is_platform_owner = true, role = 'SUPER_ADMIN' 
        WHERE email = ANY($1) 
        RETURNING email;
      `,
      args: [approved_emails]
    });

    if (promoteError) {
      console.error('Error promoting users:', promoteError);
    } else {
      results.push({ action: 'promoted', users: promotedUsers });
      console.log('Promoted users:', promotedUsers);
    }

    // Recreate the protection trigger
    console.log('Restoring platform owner protection trigger');
    await supabase.rpc('exec', {
      sql: `
        CREATE TRIGGER prevent_platform_owner_changes
        BEFORE UPDATE OR DELETE ON public.users
        FOR EACH ROW
        WHEN (OLD.is_platform_owner = true)
        EXECUTE FUNCTION public.prevent_platform_owner_changes();
      `
    });

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