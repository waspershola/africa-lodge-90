-- Create test tenant and user data for Phase 1 validation
-- Insert test plans first
INSERT INTO public.plans (id, name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days)
VALUES 
  (gen_random_uuid(), 'Starter', 35000, 350000, 25, 10, '{"frontDesk": true, "basicReports": true}', 14),
  (gen_random_uuid(), 'Growth', 65000, 650000, 75, 25, '{"frontDesk": true, "roomServiceQR": true, "posIntegration": true}', 14),
  (gen_random_uuid(), 'Pro', 120000, 1200000, 999, 100, '{"frontDesk": true, "roomServiceQR": true, "posIntegration": true, "advancedAnalytics": true}', 30)
ON CONFLICT (id) DO NOTHING;

-- Insert test tenant (will be used for validation)
WITH plan_id AS (SELECT id FROM public.plans WHERE name = 'Growth' LIMIT 1)
INSERT INTO public.tenants (
  tenant_id, 
  hotel_name, 
  hotel_slug, 
  plan_id, 
  subscription_status, 
  trial_start, 
  trial_end,
  email,
  phone,
  address,
  city,
  country,
  currency,
  timezone
) 
SELECT 
  gen_random_uuid(),
  'Test Hotel Security Validation',
  'test-hotel-security', 
  plan_id.id,
  'trialing',
  now(),
  now() + interval '14 days',
  'security-test@example.com',
  '+234-800-000-0000',
  '123 Test Security Street',
  'Lagos',
  'Nigeria',
  'NGN',
  'Africa/Lagos'
FROM plan_id
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE hotel_slug = 'test-hotel-security');

-- Create a second test tenant for cross-tenant isolation testing
WITH plan_id AS (SELECT id FROM public.plans WHERE name = 'Starter' LIMIT 1)
INSERT INTO public.tenants (
  tenant_id, 
  hotel_name, 
  hotel_slug, 
  plan_id, 
  subscription_status,
  trial_start, 
  trial_end,
  email,
  city,
  country,
  currency
) 
SELECT 
  gen_random_uuid(),
  'Isolation Test Hotel',
  'isolation-test-hotel', 
  plan_id.id,
  'trialing',
  now(),
  now() + interval '14 days',
  'isolation-test@example.com',
  'Abuja',
  'Nigeria',
  'NGN'
FROM plan_id
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE hotel_slug = 'isolation-test-hotel');