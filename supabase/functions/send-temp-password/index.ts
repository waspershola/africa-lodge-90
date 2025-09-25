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
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { user_id } = await req.json();
    
    console.log('Resetting password for user_id:', user_id);

    if (!user_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User ID is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user by ID instead of listing all users
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (getUserError || !user) {
      console.error('Error getting user:', getUserError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate new temporary password
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 10) + '!';
    console.log('Generated new temporary password');

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to reset password' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark user as requiring password reset
    const { error: userUpdateError } = await supabaseAdmin.from('users').update({
      force_reset: true,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (userUpdateError) {
      console.log('Warning: Failed to update user force_reset flag:', userUpdateError);
      // Don't fail the entire operation for this
    }

    console.log('Password reset successfully for user:', user.email);

    return new Response(JSON.stringify({
      success: true,
      message: 'Temporary password generated successfully',
      tempPassword: tempPassword
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});