import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client using environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify authentication if authorization header is present  
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('Starting email provider configuration fix...');

    // Get API keys from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('Resend API key available:', !!resendApiKey);

    const results = [];

    // Update Resend provider configuration
    if (resendApiKey) {
      console.log('Updating Resend configuration...');
      const { error: resendError } = await supabase
        .from('system_email_providers')
        .update({
          config: {
            api_key: resendApiKey,
            verified_domains: ['luxuryhotelpro.com']
          },
          is_enabled: true,
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('provider_type', 'resend');

      if (resendError) {
        console.error('Error updating Resend provider:', resendError);
        results.push({ provider: 'resend', success: false, error: resendError.message });
      } else {
        console.log('Resend provider updated successfully');
        results.push({ provider: 'resend', success: true, message: 'Updated with API key and luxuryhotelpro.com domain' });
      }
    } else {
      console.warn('RESEND_API_KEY not found in environment variables');
      results.push({ provider: 'resend', success: false, error: 'RESEND_API_KEY not found in environment' });
    }

    // Update SES provider with clean configuration
    console.log('Updating SES provider configuration...');
    const { error: sesError } = await supabase
      .from('system_email_providers')
      .update({
        config: {
          region: 'eu-north-1',
          access_key_id: '',
          secret_access_key: '',
          verified_domains: ['luxuryhotelpro.com']
        },
        is_enabled: true,
        is_default: false,
        updated_at: new Date().toISOString()
      })
      .eq('provider_type', 'ses');

    if (sesError) {
      console.error('Error updating SES provider:', sesError);
      results.push({ provider: 'ses', success: false, error: sesError.message });
    } else {
      console.log('SES provider updated successfully');
      results.push({ provider: 'ses', success: true, message: 'Updated with clean configuration and luxuryhotelpro.com domain' });
    }

    // Update MailerSend provider configuration
    console.log('Updating MailerSend provider configuration...');
    const { error: mailerSendError } = await supabase
      .from('system_email_providers')
      .update({
        config: {
          api_key: '',
          verified_domains: ['luxuryhotelpro.com']
        },
        is_enabled: true,
        is_default: false,
        updated_at: new Date().toISOString()
      })
      .eq('provider_type', 'mailersend');

    if (mailerSendError) {
      console.error('Error updating MailerSend provider:', mailerSendError);
      results.push({ provider: 'mailersend', success: false, error: mailerSendError.message });
    } else {
      console.log('MailerSend provider updated successfully');
      results.push({ provider: 'mailersend', success: true, message: 'Updated with clean configuration and luxuryhotelpro.com domain' });
    }

    // Fetch all providers to verify configurations
    const { data: providers, error: fetchError } = await supabase
      .from('system_email_providers')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching providers:', fetchError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to fetch providers: ${fetchError.message}`,
        results
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Email providers fixed successfully:', providers);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email providers fixed successfully',
      results,
      providers
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in fix-email-providers function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});