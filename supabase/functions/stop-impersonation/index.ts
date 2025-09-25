import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StopImpersonationRequest {
  session_token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { session_token }: StopImpersonationRequest = await req.json();

    if (!session_token) {
      return new Response(JSON.stringify({ error: 'session_token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find and end the impersonation session
    const { data: impersonation, error: findError } = await supabaseAdmin
      .from('impersonations')
      .select('*, users!impersonations_impersonated_user_id_fkey(email)')
      .eq('session_token', session_token)
      .is('ended_at', null)
      .single();

    if (findError || !impersonation) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // End the impersonation session
    const { error: updateError } = await supabaseAdmin
      .from('impersonations')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', impersonation.id);

    if (updateError) {
      console.error('Failed to end impersonation session:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to end impersonation session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log audit event
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_id: impersonation.original_user_id,
        action: 'impersonation_ended',
        resource_type: 'user',
        resource_id: impersonation.impersonated_user_id,
        description: `Ended impersonation session`,
        metadata: {
          session_token,
          duration_minutes: Math.round((new Date().getTime() - new Date(impersonation.started_at).getTime()) / (1000 * 60))
        }
      });

    return new Response(JSON.stringify({
      success: true,
      message: 'Impersonation session ended successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in stop-impersonation function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);