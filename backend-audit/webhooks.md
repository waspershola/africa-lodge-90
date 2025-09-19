# Webhook Endpoints & Security

## Overview
Secure webhook handlers for payment processing, SMS notifications, and external integrations.

## Payment Webhooks

### 1. Paystack Webhook
```
Endpoint: POST /webhooks/paystack
Content-Type: application/json
Authentication: HMAC-SHA512 signature verification
```

**Expected Events:**
- `charge.success` - Subscription payment succeeded
- `subscription.create` - New subscription created
- `subscription.disable` - Subscription cancelled
- `invoice.create` - Invoice generated
- `invoice.payment_failed` - Payment failed

**Payload Example:**
```json
{
  "event": "charge.success",
  "data": {
    "id": 302961,
    "domain": "live",
    "status": "success",
    "reference": "qTPrJoy9Bx",
    "amount": 10000,
    "message": null,
    "gateway_response": "Successful",
    "paid_at": "2023-01-01T10:00:00.000Z",
    "created_at": "2023-01-01T09:45:00.000Z",
    "channel": "card",
    "currency": "NGN",
    "metadata": {
      "tenant_id": "uuid",
      "subscription_id": "uuid",
      "plan_id": "growth"
    }
  }
}
```

**Handler Logic:**
```typescript
// Edge Function: supabase/functions/paystack-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const signature = req.headers.get('x-paystack-signature');
  const body = await req.text();
  
  // Verify signature
  const hash = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(Deno.env.get('PAYSTACK_SECRET_KEY')),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', hash, new TextEncoder().encode(body));
  // Compare signatures...
  
  const event = JSON.parse(body);
  
  switch (event.event) {
    case 'charge.success':
      await handleSubscriptionPayment(event.data);
      break;
    case 'subscription.disable':
      await handleSubscriptionCancellation(event.data);
      break;
  }
  
  return new Response('OK', { status: 200 });
});
```

### 2. Stripe Webhook
```
Endpoint: POST /webhooks/stripe
Content-Type: application/json
Authentication: Stripe signature verification
```

**Expected Events:**
- `invoice.payment_succeeded`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

**Security Implementation:**
```typescript
// Verify Stripe signature
const sig = req.headers.get('stripe-signature');
const endpointSecret = Deno.env.get('STRIPE_ENDPOINT_SECRET');

let event;
try {
  event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
} catch (err) {
  return new Response(`Webhook signature verification failed.`, { status: 400 });
}
```

## SMS & Communication Webhooks

### 1. Twilio SMS Status Webhook
```
Endpoint: POST /webhooks/twilio/sms
Content-Type: application/x-www-form-urlencoded
Authentication: Twilio signature verification
```

**Use Cases:**
- Staff notification delivery status
- Guest SMS confirmations
- Password reset message status

### 2. Email Delivery Status (SendGrid)
```
Endpoint: POST /webhooks/sendgrid/events
Content-Type: application/json
Authentication: SendGrid signed events
```

## QR Service Webhooks

### 1. Third-party Service Integration
```
Endpoint: POST /webhooks/qr-service/:tenant_id
Content-Type: application/json
Authentication: Tenant-specific API key
```

**Purpose:**
- External room service providers
- Laundry service confirmations
- Transport booking updates

## Security Best Practices

### 1. Signature Verification
```typescript
// Generic signature verification utility
export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
  algorithm: 'SHA256' | 'SHA512' = 'SHA256'
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: `SHA-${algorithm}` },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign(
    'HMAC', 
    key, 
    new TextEncoder().encode(body)
  );
  
  const receivedSignature = hexToArrayBuffer(signature);
  
  return arrayBuffersEqual(expectedSignature, receivedSignature);
}
```

### 2. Idempotency Protection
```sql
-- Webhook events tracking table
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'paystack', 'stripe', 'twilio'
  event_id TEXT NOT NULL, -- External event ID
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payload JSONB NOT NULL,
  
  UNIQUE(provider, event_id)
);
```

### 3. Rate Limiting
```typescript
// Rate limiting by provider
const rateLimits = {
  paystack: { requests: 100, window: 60 }, // 100 req/min
  stripe: { requests: 100, window: 60 },
  twilio: { requests: 200, window: 60 }
};
```

### 4. IP Whitelisting
```typescript
// Allowed webhook source IPs
const allowedIPs = {
  paystack: ['52.31.139.75', '52.49.173.169', '52.214.14.220'],
  stripe: ['54.187.174.169', '54.187.205.235', '54.187.216.72'],
  twilio: ['54.172.60.0/23', '54.244.51.0/24']
};
```

## Error Handling & Retry Logic

### 1. Webhook Processing Queue
```sql
-- Failed webhook processing queue
CREATE TABLE webhook_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id UUID REFERENCES webhook_events(id),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Exponential Backoff
```typescript
// Retry schedule: 1min, 5min, 25min, 2hrs, 10hrs
const retryDelays = [60, 300, 1500, 7200, 36000]; // seconds

async function scheduleRetry(eventId: string, attempt: number) {
  if (attempt >= retryDelays.length) {
    // Send alert to administrators
    await sendAdminAlert(`Webhook processing failed after ${attempt} attempts`, eventId);
    return;
  }
  
  const delaySeconds = retryDelays[attempt];
  const nextRetry = new Date(Date.now() + delaySeconds * 1000);
  
  await supabase
    .from('webhook_retry_queue')
    .insert({
      webhook_event_id: eventId,
      retry_count: attempt,
      next_retry_at: nextRetry
    });
}
```

## Monitoring & Alerting

### 1. Webhook Health Dashboard
- Success/failure rates per provider
- Average processing time
- Failed webhook alerts
- Retry queue monitoring

### 2. Critical Alerts
```typescript
// Send immediate alerts for:
const criticalEvents = [
  'subscription payment failed',
  'webhook signature verification failed',
  'database write failure during webhook processing',
  'retry queue backup over 100 items'
];
```

## Testing & Validation

### 1. Webhook Testing Tools
- Use ngrok for local development
- Webhook.site for payload inspection  
- Provider testing tools (Stripe CLI, Paystack test webhooks)

### 2. Test Scenarios
```bash
# Test webhook endpoints
curl -X POST http://localhost:54321/functions/v1/paystack-webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test-signature" \
  -d '{"event": "charge.success", "data": {...}}'
```

### 3. Integration Tests
- Mock webhook events for CI/CD
- Verify signature validation
- Test idempotency protection
- Validate retry mechanism

## Deployment Configuration

### 1. Environment Variables
```bash
# Payment providers
PAYSTACK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_ENDPOINT_SECRET=whsec_...

# Communication
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=...

# Security
WEBHOOK_SIGNING_SECRET=random-256-bit-key
```

### 2. Edge Function Configuration
```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

## Compliance & Audit

1. **PCI DSS**: Never log full payment card data
2. **GDPR**: Minimize personal data in webhook logs
3. **Audit Trail**: Log all webhook processing events
4. **Data Retention**: Purge webhook logs after 90 days
5. **Security Reviews**: Regular webhook endpoint security audits