import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProvisionRequest {
  tenant_id: string;
  credits: number;
  source_type: 'plan_included' | 'addon_purchase' | 'manual_topup';
  source_id?: string;
  purpose?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tenant_id, credits, source_type, source_id, purpose }: ProvisionRequest = await req.json();

    // Validate input
    if (!tenant_id || !credits || credits <= 0 || !source_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenant_id, credits, source_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Provisioning ${credits} SMS credits for tenant ${tenant_id} from ${source_type}`);

    // Call the database function to provision credits
    const { error: provisionError } = await supabaseClient.rpc('provision_sms_credits', {
      p_tenant_id: tenant_id,
      p_credits: credits,
      p_source_type: source_type,
      p_source_id: source_id,
      p_purpose: purpose
    });

    if (provisionError) {
      console.error('Error provisioning SMS credits:', provisionError);
      return new Response(
        JSON.stringify({ error: 'Failed to provision credits', details: provisionError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get updated balance
    const { data: balanceData, error: balanceError } = await supabaseClient.rpc('get_sms_credits_balance', {
      p_tenant_id: tenant_id
    });

    if (balanceError) {
      console.error('Error fetching updated balance:', balanceError);
    }

    const response = {
      success: true,
      message: `Successfully provisioned ${credits} SMS credits`,
      new_balance: balanceData || 0,
      tenant_id,
      credits_added: credits,
      source_type,
      timestamp: new Date().toISOString()
    };

    console.log('SMS credits provisioned successfully:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in provision-sms-credits function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});