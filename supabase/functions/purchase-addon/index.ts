import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchaseRequest {
  tenant_id: string;
  addon_id: string;
  quantity?: number;
  auto_renew?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tenant_id, addon_id, quantity = 1, auto_renew = false }: PurchaseRequest = await req.json();

    // Validate input
    if (!tenant_id || !addon_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenant_id, addon_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing addon purchase: ${addon_id} for tenant ${tenant_id}`);

    // Get addon details
    const { data: addon, error: addonError } = await supabaseClient
      .from('addons')
      .select('*')
      .eq('id', addon_id)
      .eq('is_active', true)
      .single();

    if (addonError || !addon) {
      console.error('Addon not found or inactive:', addonError);
      return new Response(
        JSON.stringify({ error: 'Addon not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate expiration date for recurring add-ons
    let expiresAt = null;
    if (addon.is_recurring) {
      const now = new Date();
      switch (addon.billing_interval) {
        case 'monthly':
          expiresAt = new Date(now.setMonth(now.getMonth() + 1));
          break;
        case 'quarterly':
          expiresAt = new Date(now.setMonth(now.getMonth() + 3));
          break;
        case 'yearly':
          expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
          break;
      }
    }

    // Insert tenant addon record
    const { data: tenantAddon, error: tenantAddonError } = await supabaseClient
      .from('tenant_addons')
      .insert({
        tenant_id,
        addon_id,
        quantity,
        auto_renew,
        expires_at: expiresAt?.toISOString(),
        metadata: {
          purchase_price: addon.price,
          original_addon: addon
        }
      })
      .select()
      .single();

    if (tenantAddonError) {
      console.error('Error creating tenant addon:', tenantAddonError);
      return new Response(
        JSON.stringify({ error: 'Failed to create addon subscription', details: tenantAddonError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Provision SMS credits if this addon includes them
    let smsProvisionResult = null;
    if (addon.sms_credits_bonus > 0) {
      const totalCredits = addon.sms_credits_bonus * quantity;
      
      const { error: provisionError } = await supabaseClient.rpc('provision_sms_credits', {
        p_tenant_id: tenant_id,
        p_credits: totalCredits,
        p_source_type: 'addon_purchase',
        p_source_id: tenantAddon.id,
        p_purpose: `${addon.name} purchase`
      });

      if (provisionError) {
        console.error('Error provisioning SMS credits:', provisionError);
        // Don't fail the entire purchase, but log the error
        smsProvisionResult = { error: provisionError.message };
      } else {
        smsProvisionResult = { credits_added: totalCredits };
        console.log(`Provisioned ${totalCredits} SMS credits for addon purchase`);
      }
    }

    // Get updated SMS balance
    const { data: balanceData } = await supabaseClient.rpc('get_sms_credits_balance', {
      p_tenant_id: tenant_id
    });

    const response = {
      success: true,
      message: `Successfully purchased ${addon.name}`,
      addon_purchase: {
        id: tenantAddon.id,
        addon: addon,
        quantity,
        expires_at: expiresAt?.toISOString(),
        auto_renew
      },
      sms_credits: smsProvisionResult,
      current_sms_balance: balanceData || 0,
      total_cost: addon.price * quantity,
      timestamp: new Date().toISOString()
    };

    console.log('Addon purchased successfully:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in purchase-addon function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});