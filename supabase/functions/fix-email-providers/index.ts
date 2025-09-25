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

    // Verify user is authenticated and is super admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Verifying authentication...');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication error:', authError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Checking user permissions...');
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'SUPER_ADMIN') {
      console.log('Permission error:', userError, userData?.role);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Insufficient permissions' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Updating Resend provider configuration...');
    
    // Get the actual Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not found in environment');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Resend API key not configured in environment' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update Resend provider with proper API key
    const { error: updateError } = await supabaseClient
      .from('system_email_providers')
      .update({
        config: {
          api_key: resendApiKey,
          verified_domains: []
        }
      })
      .eq('provider_type', 'resend');

    if (updateError) {
      console.error('Error updating Resend provider:', updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to update Resend configuration' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all providers to check configuration
    const { data: providers, error: fetchError } = await supabaseClient
      .from('system_email_providers')
      .select('*')
      .order('created_at');

    if (fetchError) {
      console.error('Error fetching providers:', fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch providers' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Providers updated successfully:', providers?.length);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email providers configuration updated successfully',
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