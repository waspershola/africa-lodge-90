import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const operationId = crypto.randomUUID().substring(0, 8);
  console.log(`[${operationId}] Generate temp password function started`);

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

    const { user_id } = await req.json();
    
    if (!user_id) {
      console.error(`[${operationId}] Missing user_id`);
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${operationId}] Generating temp password for user: ${user_id}`);

    // Get user info
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (getUserError || !user) {
      console.error(`[${operationId}] User not found:`, getUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate temporary password
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 10) + '!';
    console.log(`[${operationId}] Generated temporary password`);

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error(`[${operationId}] Failed to update password:`, updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark user as requiring password reset
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        force_reset: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.warn(`[${operationId}] Failed to update force_reset flag:`, userUpdateError);
    }

    console.log(`[${operationId}] Temporary password generated successfully for: ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Temporary password generated successfully',
        tempPassword: tempPassword
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[${operationId}] Error in generate-temp-password function:`, error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});