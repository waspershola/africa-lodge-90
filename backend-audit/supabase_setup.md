# Supabase Setup Instructions
**Hotel Management System Backend Configuration**

## Prerequisites
- Supabase project already exists: `cwamveqcwccpaiwrzifk`
- Lovable Supabase integration enabled (green button in UI)
- Project admin access to Supabase dashboard

---

## 1. Database Schema Setup

### 1.1 Execute SQL Migrations
```sql
-- In Supabase SQL Editor, execute in order:

-- Step 1: Create tables and indexes
-- Copy and paste entire contents of: backend-audit/migrations/001_schema.sql

-- Step 2: Configure Row Level Security  
-- Copy and paste entire contents of: backend-audit/migrations/002_rls_policies.sql
```

**⚠️ Important**: Execute migrations in order. Validate each step completes without errors.

### 1.2 Verify Schema
```sql
-- Validate tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify RLS enabled  
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## 2. Authentication Configuration

### 2.1 Enable Auth Providers
1. Navigate to **Authentication > Providers**
2. Enable **Email** provider
3. Configure settings:
   ```yaml
   Enable email confirmations: true
   Enable secure email change: true
   Double confirm email changes: true
   ```

### 2.2 Auth Email Templates
1. Go to **Authentication > Email Templates**
2. Update templates:

**Confirm Signup Template**:
```html
<h2>Welcome to {{ .SiteName }}</h2>
<p>You've been invited to join {{ .SiteName }} as hotel staff.</p>
<p>Click the link below to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Account</a></p>
```

**Reset Password Template**:
```html
<h2>Password Reset - {{ .SiteName }}</h2>
<p>Someone requested a password reset for your account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can ignore this email.</p>
```

### 2.3 JWT Settings  
1. Go to **Settings > API**
2. Note JWT Settings:
   - JWT expiry: `3600` (1 hour)
   - Refresh token expiry: `604800` (1 week)

---

## 3. Storage Configuration

### 3.1 Create Storage Buckets
```sql
-- Execute in SQL Editor to create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('hotel-logos', 'hotel-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('qr-codes', 'qr-codes', true, 1048576, ARRAY['image/png', 'image/svg+xml']),  
('receipts', 'receipts', false, 10485760, ARRAY['application/pdf']),
('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']);
```

### 3.2 Storage Policies
```sql
-- Hotel logos (public read, tenant write)
CREATE POLICY "Public can view hotel logos" ON storage.objects 
FOR SELECT USING (bucket_id = 'hotel-logos');

CREATE POLICY "Tenants can upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'hotel-logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'tenant_id'
);

-- QR codes (public read, managers can write)  
CREATE POLICY "Public can view QR codes" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-codes');

CREATE POLICY "Managers can upload QR codes" ON storage.objects  
FOR INSERT WITH CHECK (
  bucket_id = 'qr-codes'
  AND auth.jwt() ->> 'role' IN ('OWNER', 'MANAGER')
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'tenant_id'  
);

-- Receipts (tenant access only)
CREATE POLICY "Tenants can access receipts" ON storage.objects
FOR ALL USING (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated' 
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'tenant_id'
);
```

---

## 4. Edge Functions Setup

### 4.1 Deploy Edge Functions
```bash
# From project root, deploy functions
supabase functions deploy impersonation-handler
supabase functions deploy webhook-handler  
supabase functions deploy qr-token-generator
supabase functions deploy offline-sync-processor
```

### 4.2 Impersonation Function
Create `supabase/functions/impersonation-handler/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { target_user_id, reason } = await req.json()

  // Validate super admin permissions
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user || user.user_metadata?.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  // Log impersonation start
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'IMPERSONATION_START',
    resource_type: 'user',
    resource_id: target_user_id,
    description: reason,
    metadata: { target_user_id, reason }
  })

  // Generate impersonation token (24hr expiry)
  const { data } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: target_user_id,
    options: {
      data: { impersonation: true, impersonator_id: user.id }
    }
  })

  return new Response(JSON.stringify({
    impersonation_token: data.properties?.action_link,
    expires_at: new Date(Date.now() + 24*60*60*1000).toISOString()
  }))
})
```

---

## 5. Realtime Configuration  

### 5.1 Enable Realtime  
```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE qr_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE pos_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE housekeeping_tasks;  
ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
```

### 5.2 Configure Realtime Channels
- `hotel_{tenant_id}_qr_orders` - QR service requests  
- `hotel_{tenant_id}_pos_orders` - Kitchen display orders
- `hotel_{tenant_id}_housekeeping` - Task updates
- `hotel_{tenant_id}_maintenance` - Work order updates  
- `hotel_{tenant_id}_rooms` - Room status changes

---

## 6. Scheduled Functions (pg_cron)

### 6.1 Trial Expiry Check
```sql
-- Run daily at 09:00 UTC to check trial expirations
SELECT cron.schedule('trial-expiry-check', '0 9 * * *', $$
  UPDATE tenants 
  SET subscription_status = 'expired'
  WHERE subscription_status = 'trialing' 
    AND trial_end < NOW()
    AND setup_completed = true;
$$);
```

### 6.2 Cleanup Temporary Passwords
```sql  
-- Clean expired temp passwords every hour
SELECT cron.schedule('cleanup-temp-passwords', '0 * * * *', $$
  UPDATE users 
  SET temp_password_hash = NULL, 
      temp_expires = NULL,
      force_reset = false
  WHERE temp_expires < NOW();
$$);
```

### 6.3 Offline Queue Cleanup
```sql
-- Clean old synced offline actions (keep 30 days)
SELECT cron.schedule('cleanup-offline-actions', '0 2 * * *', $$
  DELETE FROM offline_actions 
  WHERE sync_status = 'synced' 
    AND created_at < NOW() - INTERVAL '30 days';
$$);
```

---

## 7. Environment Variables & Secrets

### 7.1 Required Environment Variables
Set in **Settings > Environment Variables**:

```env
# Hotel Management App Settings
APP_NAME=Hotel Management System
APP_URL=https://your-app.lovable.app

# Payment Provider Keys (use Supabase Vault)  
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-app-password

# System Settings
DEFAULT_CURRENCY=NGN
DEFAULT_TIMEZONE=Africa/Lagos
TRIAL_DAYS=14
```

### 7.2 Store Secrets in Supabase Vault
```sql
-- Store sensitive keys in Supabase Vault
SELECT vault.create_secret('paystack-secret-key', 'sk_test_your_key');
SELECT vault.create_secret('stripe-secret-key', 'sk_test_your_key');
SELECT vault.create_secret('smtp-password', 'your-smtp-password');
```

---

## 8. Webhook Endpoints

### 8.1 Paystack Webhook
Create `supabase/functions/paystack-webhook/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts"

serve(async (req) => {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')
  
  // Verify webhook signature
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')!
  const expectedSignature = createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex')

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)
  
  // Process payment events
  if (event.event === 'charge.success') {
    // Update subscription status in database
    // Log payment in audit trail
  }
  
  return new Response('OK')
})
```

### 8.2 Webhook URLs
Configure in payment providers:
- Paystack: `https://your-project.supabase.co/functions/v1/paystack-webhook`
- Stripe: `https://your-project.supabase.co/functions/v1/stripe-webhook`

---

## 9. Security Configuration

### 9.1 CORS Settings
In **Settings > API**:
```json
{
  "origins": [
    "https://your-app.lovable.app",
    "https://localhost:3000",
    "https://localhost:5173"
  ],
  "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}
```

### 9.2 Rate Limiting  
```sql
-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier TEXT,
  max_requests INTEGER DEFAULT 100,
  window_seconds INTEGER DEFAULT 3600
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Count requests in current window
  SELECT COUNT(*) INTO current_count
  FROM audit_log 
  WHERE 
    (metadata->>'ip_address' = identifier OR actor_email = identifier)
    AND created_at > NOW() - (window_seconds || ' seconds')::INTERVAL;
    
  RETURN current_count < max_requests;
END;
$$ LANGUAGE plpgsql;
```

---

## 10. Backup Configuration

### 10.1 Enable Point-in-Time Recovery
1. Go to **Settings > Database**  
2. Enable **Point in Time Recovery**
3. Set retention: **7 days** (adjust per plan)

### 10.2 Scheduled Backups
```sql
-- Create backup function
CREATE OR REPLACE FUNCTION create_tenant_backup(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  backup_name TEXT;
BEGIN
  backup_name := 'tenant_' || tenant_uuid || '_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI');
  
  -- This would integrate with your backup system
  -- For now, log the backup request
  INSERT INTO audit_log (
    tenant_id, action, resource_type, description, metadata
  ) VALUES (
    tenant_uuid, 'BACKUP_CREATED', 'tenant', 
    'Automated tenant backup created', 
    jsonb_build_object('backup_name', backup_name)
  );
  
  RETURN backup_name;
END;
$$ LANGUAGE plpgsql;

-- Schedule weekly backups
SELECT cron.schedule('weekly-backups', '0 2 * * 0', $$
  SELECT create_tenant_backup(tenant_id) FROM tenants WHERE setup_completed = true;
$$);
```

---

## 11. Validation & Testing

### 11.1 Verify Setup
```sql
-- Test RLS policies
SET role authenticated;
SET jwt.claims.tenant_id TO '550e8400-e29b-41d4-a716-446655440001';
SET jwt.claims.role TO 'OWNER';

-- Should return data
SELECT * FROM rooms LIMIT 5;

-- Should return empty (different tenant)
SET jwt.claims.tenant_id TO '550e8400-e29b-41d4-a716-446655440999';
SELECT * FROM rooms LIMIT 5;
```

### 11.2 Test Realtime
```javascript
// In browser console
const supabase = createClient('your-url', 'your-anon-key')
const channel = supabase
  .channel('hotel_test_qr_orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'qr_orders' },
    payload => console.log('QR Order Update:', payload)
  )
  .subscribe()
```

---

## 12. Production Checklist

### ✅ Database
- [ ] Schema migrations executed
- [ ] RLS policies configured  
- [ ] Indexes created
- [ ] Triggers functional

### ✅ Authentication  
- [ ] Email provider enabled
- [ ] Templates customized
- [ ] JWT settings configured

### ✅ Storage
- [ ] Buckets created
- [ ] Policies configured
- [ ] File size limits set

### ✅ Security
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Secrets in vault
- [ ] Webhooks secured

### ✅ Operations
- [ ] Scheduled jobs running
- [ ] Realtime enabled
- [ ] Backups configured
- [ ] Monitoring setup

---

## 🚀 Ready for Production

Once all checklist items are complete:
1. Update Lovable app to use real Supabase calls
2. Deploy edge functions  
3. Configure payment webhooks
4. Test end-to-end flows
5. Monitor for errors in Supabase logs

**Support**: For issues, check Supabase logs in **Logs > Database** and **Logs > Edge Functions**