import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Define the users and their temporary passwords
    const systemOwners = [
      { email: 'wasperstore@gmail.com', tempPassword: 'TempPassword123!' },
      { email: 'ceo@waspersolution.com', tempPassword: 'TempPass2024!' },
      { email: 'waspershola@gmail.com', tempPassword: 'TempPass2025!' }
    ];

    const results = [];

    for (const owner of systemOwners) {
      try {
        console.log(`Resetting password for: ${owner.email}`);

        // Get user from auth
        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
        if (listError) {
          console.error('Error listing users:', listError);
          results.push({ email: owner.email, success: false, error: listError.message });
          continue;
        }

        const authUser = users.find(u => u.email === owner.email);
        if (!authUser) {
          console.error(`User not found in auth: ${owner.email}`);
          results.push({ email: owner.email, success: false, error: 'User not found in auth' });
          continue;
        }

        // Update the user's password using the admin API
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          authUser.id,
          {
            password: owner.tempPassword,
            email_confirm: true
          }
        );

        if (updateError) {
          console.error(`Error updating password for ${owner.email}:`, updateError);
          results.push({ email: owner.email, success: false, error: updateError.message });
          continue;
        }

        // Ensure the user record in public.users has force_reset set to true
        const { error: dbUpdateError } = await supabaseClient
          .from('users')
          .update({ 
            force_reset: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', owner.email);

        if (dbUpdateError) {
          console.error(`Error updating user record for ${owner.email}:`, dbUpdateError);
          // Don't fail the whole operation for this, as the password reset is the main goal
        }

        console.log(`Successfully reset password for: ${owner.email}`);
        results.push({ 
          email: owner.email, 
          success: true, 
          tempPassword: owner.tempPassword 
        });

      } catch (error: any) {
        console.error(`Unexpected error for ${owner.email}:`, error);
        results.push({ email: owner.email, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Password reset operation completed',
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Unexpected error in password reset function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});