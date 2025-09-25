import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting fix email providers function...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Optional auth check - more permissive for fixing
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      console.log('Verifying authentication...');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (!authError && user) {
        console.log('Authenticated user:', user.email);
      } else {
        console.log('Authentication failed, proceeding with system fix');
      }
    }

    console.log('Updating email provider configurations...');
    
    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('Environment check:', {
      hasResendKey: !!resendApiKey
    });

    if (!resendApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'RESEND_API_KEY not found in environment variables' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update Resend provider with proper API key
    console.log('Updating Resend provider...');
    const { error: updateResendError } = await supabaseClient
      .from('system_email_providers')
      .update({
        config: {
          api_key: resendApiKey,
          verified_domains: []
        },
        is_enabled: true
      })
      .eq('provider_type', 'resend');

    if (updateResendError) {
      console.error('Error updating Resend provider:', updateResendError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to update Resend configuration: ' + updateResendError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update SES region to Europe (Stockholm)
    console.log('Updating SES region to eu-north-1...');
    const { error: updateSESError } = await supabaseClient
      .from('system_email_providers')
      .update({
        config: supabaseClient.rpc('jsonb_set', {
          target: 'config',
          path: '{region}',
          new_value: '"eu-north-1"'
        })
      })
      .eq('provider_type', 'ses');

    if (updateSESError) {
      console.log('SES region update error (non-critical):', updateSESError.message);
    }

    // Fetch all providers to verify updates
    const { data: providers, error: fetchError } = await supabaseClient
      .from('system_email_providers')
      .select('*')
      .order('created_at');

    if (fetchError) {
      console.error('Error fetching providers:', fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch updated providers: ' + fetchError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Providers updated successfully. Count:', providers?.length);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email providers fixed successfully',
      providersUpdated: providers?.length || 0,
      providers: providers?.map(p => ({
        provider_type: p.provider_type,
        provider_name: p.provider_name,
        is_enabled: p.is_enabled,
        is_default: p.is_default,
        has_config: !!p.config && Object.keys(p.config).length > 0
      }))
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Fix email providers error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});