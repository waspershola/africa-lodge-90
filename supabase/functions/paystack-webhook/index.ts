import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      tenant_id?: string;
      subscription_type?: string;
      plan_id?: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
    };
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const verifyPaystackSignature = (rawBody: string, signature: string): boolean => {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(rawBody);
  const key = encoder.encode(secret);

  return crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  ).then(cryptoKey =>
    crypto.subtle.sign('HMAC', cryptoKey, data)
  ).then(signature_buffer => {
    const signature_array = Array.from(new Uint8Array(signature_buffer));
    const signature_hex = signature_array.map(b => b.toString(16).padStart(2, '0')).join('');
    return signature_hex === signature;
  }).catch(() => false);
};

const handleSubscriptionPayment = async (event: PaystackWebhookEvent) => {
  const { data } = event;
  const tenantId = data.metadata.tenant_id;
  const planId = data.metadata.plan_id;

  if (!tenantId) {
    console.error('No tenant_id in metadata');
    return;
  }

  try {
    if (data.status === 'success') {
      // Update tenant subscription status
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          subscription_status: 'active',
          trial_end: null,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId);

      if (tenantError) {
        console.error('Error updating tenant:', tenantError);
        return;
      }

      // Log successful payment
      await supabase
        .from('audit_log')
        .insert({
          action: 'PAYMENT_SUCCESS',
          resource_type: 'tenant',
          resource_id: tenantId,
          tenant_id: tenantId,
          description: `Paystack payment successful: ${data.reference}`,
          metadata: {
            payment_id: data.id,
            amount: data.amount / 100, // Paystack amounts are in kobo
            currency: data.currency,
            channel: data.channel
          }
        });

      console.log(`Subscription activated for tenant ${tenantId}`);
    } else {
      // Handle failed payment
      await supabase
        .from('audit_log')
        .insert({
          action: 'PAYMENT_FAILED',
          resource_type: 'tenant',
          resource_id: tenantId,
          tenant_id: tenantId,
          description: `Paystack payment failed: ${data.reference}`,
          metadata: {
            payment_id: data.id,
            gateway_response: data.gateway_response,
            amount: data.amount / 100
          }
        });

      console.log(`Payment failed for tenant ${tenantId}: ${data.gateway_response}`);
    }
  } catch (error) {
    console.error('Error handling subscription payment:', error);
  }
};

const handleTrialExpiration = async () => {
  try {
    // Find tenants with expired trials
    const { data: expiredTenants, error } = await supabase
      .from('tenants')
      .select('tenant_id, hotel_name, email')
      .eq('subscription_status', 'trialing')
      .lt('trial_end', new Date().toISOString());

    if (error) {
      console.error('Error finding expired tenants:', error);
      return;
    }

    for (const tenant of expiredTenants || []) {
      // Update tenant status to expired
      await supabase
        .from('tenants')
        .update({
          subscription_status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant.tenant_id);

      // Log trial expiration
      await supabase
        .from('audit_log')
        .insert({
          action: 'TRIAL_EXPIRED',
          resource_type: 'tenant',
          resource_id: tenant.tenant_id,
          tenant_id: tenant.tenant_id,
          description: `Trial expired for ${tenant.hotel_name}`,
          metadata: {
            hotel_name: tenant.hotel_name,
            email: tenant.email
          }
        });

      console.log(`Trial expired for tenant ${tenant.tenant_id}: ${tenant.hotel_name}`);
    }
  } catch (error) {
    console.error('Error handling trial expiration:', error);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    const isValid = await verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      console.error('Invalid Paystack signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const event: PaystackWebhookEvent = JSON.parse(rawBody);
    console.log('Received Paystack webhook:', event.event);

    switch (event.event) {
      case 'charge.success':
      case 'charge.failed':
        await handleSubscriptionPayment(event);
        break;
      
      case 'subscription.create':
      case 'subscription.disable':
      case 'subscription.enable':
        console.log(`Subscription event: ${event.event}`);
        break;
      
      case 'invoice.create':
      case 'invoice.payment_failed':
        console.log(`Invoice event: ${event.event}`);
        break;
      
      default:
        console.log(`Unhandled event: ${event.event}`);
    }

    // Check for trial expirations (called periodically)
    if (event.event === 'charge.success') {
      await handleTrialExpiration();
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in paystack-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);