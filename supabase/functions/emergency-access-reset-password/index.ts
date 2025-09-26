import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
  sessionToken: string;
  newPassword: string;
  userAgent?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Emergency password reset function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionToken, newPassword, userAgent }: ResetPasswordRequest = await req.json();

    if (!sessionToken || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session token and new password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all platform owners to reset (since this is emergency access)
    const { data: platformOwners, error: ownersError } = await supabase
      .from('users')
      .select('id, email')
      .eq('is_platform_owner', true)
      .in('email', ['wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com']);

    if (ownersError || !platformOwners || platformOwners.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorized users found for password reset' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset passwords for all platform owners using admin API
    const resetResults = [];
    
    for (const owner of platformOwners) {
      try {
        const { error: resetError } = await supabase.auth.admin.updateUserById(
          owner.id,
          { password: newPassword }
        );

        if (resetError) {
          console.error(`Failed to reset password for ${owner.email}:`, resetError);
          resetResults.push({ email: owner.email, success: false, error: resetError.message });
        } else {
          resetResults.push({ email: owner.email, success: true });
          
          // Log successful password reset
          await supabase.from('emergency_access_attempts').insert({
            user_id: owner.id,
            attempt_type: 'password_reset',
            success: true,
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: userAgent
          });
        }
      } catch (error) {
        console.error(`Error resetting password for ${owner.email}:`, error);
        resetResults.push({ email: owner.email, success: false, error: (error as Error).message });
      }
    }

    const successfulResets = resetResults.filter(r => r.success);
    
    if (successfulResets.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to reset any passwords', details: resetResults }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully reset passwords for ${successfulResets.length} platform owner(s)`,
        results: resetResults
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Emergency password reset error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Emergency password reset failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});