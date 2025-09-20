import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

interface StripeWebhookEvent {
  id: string;
  object: "event";
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const verifyStripeSignature = async (rawBody: string, signature: string): Promise<boolean> => {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return false;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawBody);
    const key = encoder.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Extract timestamp and signature from Stripe header
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const stripeSignature = elements.find(el => el.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !stripeSignature) return false;
    
    // Verify timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(timestamp) > 300) return false;
    
    const payload = timestamp + '.' + rawBody;
    const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    return expectedHex === stripeSignature;
  } catch (error) {
    console.error('Stripe signature verification failed:', error);
    return false;
  }
};

const handlePaymentSuccess = async (event: StripeWebhookEvent) => {
  const paymentIntent = event.data.object;
  const tenantId = paymentIntent.metadata?.tenant_id;
  const planId = paymentIntent.metadata?.plan_id;

  if (!tenantId) {
    console.error('No tenant_id in payment intent metadata');
    return;
  }

  try {
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
        description: `Stripe payment successful: ${paymentIntent.id}`,
        metadata: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Stripe amounts are in cents
          currency: paymentIntent.currency.toUpperCase(),
          payment_method: paymentIntent.payment_method_types[0]
        }
      });

    console.log(`Subscription activated for tenant ${tenantId} via Stripe`);
  } catch (error) {
    console.error('Error handling Stripe payment success:', error);
  }
};

const handlePaymentFailed = async (event: StripeWebhookEvent) => {
  const paymentIntent = event.data.object;
  const tenantId = paymentIntent.metadata?.tenant_id;

  if (!tenantId) {
    console.error('No tenant_id in payment intent metadata');
    return;
  }

  try {
    // Log failed payment
    await supabase
      .from('audit_log')
      .insert({
        action: 'PAYMENT_FAILED',
        resource_type: 'tenant',
        resource_id: tenantId,
        tenant_id: tenantId,
        description: `Stripe payment failed: ${paymentIntent.id}`,
        metadata: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          failure_code: paymentIntent.last_payment_error?.code,
          failure_message: paymentIntent.last_payment_error?.message
        }
      });

    console.log(`Payment failed for tenant ${tenantId}: ${paymentIntent.last_payment_error?.message}`);
  } catch (error) {
    console.error('Error handling Stripe payment failure:', error);
  }
};

const handleSubscriptionUpdated = async (event: StripeWebhookEvent) => {
  const subscription = event.data.object;
  const tenantId = subscription.metadata?.tenant_id;

  if (!tenantId) {
    console.error('No tenant_id in subscription metadata');
    return;
  }

  try {
    let subscriptionStatus = 'active';
    
    // Map Stripe subscription status to our status
    switch (subscription.status) {
      case 'active':
        subscriptionStatus = 'active';
        break;
      case 'canceled':
      case 'incomplete_expired':
        subscriptionStatus = 'expired';
        break;
      case 'past_due':
      case 'unpaid':
        subscriptionStatus = 'suspended';
        break;
      case 'trialing':
        subscriptionStatus = 'trialing';
        break;
      default:
        subscriptionStatus = 'suspended';
    }

    // Update tenant subscription status
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (tenantError) {
      console.error('Error updating tenant subscription:', tenantError);
      return;
    }

    // Log subscription change
    await supabase
      .from('audit_log')
      .insert({
        action: 'SUBSCRIPTION_UPDATED',
        resource_type: 'tenant',
        resource_id: tenantId,
        tenant_id: tenantId,
        description: `Stripe subscription ${subscription.status}: ${subscription.id}`,
        metadata: {
          subscription_id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end
        }
      });

    console.log(`Subscription updated for tenant ${tenantId}: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Verify webhook signature
    const isValid = await verifyStripeSignature(rawBody, signature);
    if (!isValid) {
      console.error('Invalid Stripe signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const event: StripeWebhookEvent = JSON.parse(rawBody);
    console.log('Received Stripe webhook:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object.id);
        break;
      
      case 'invoice.payment_failed':
        console.log('Invoice payment failed:', event.data.object.id);
        break;
      
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in stripe-webhook function:", error);
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