-- Phase 2 Data Seeding: Insert sample data for testing (Fixed version)

-- Insert sample plans
INSERT INTO plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
SELECT 'Starter', 99.00, 990.00, 20, 5, '{"pos": false, "maintenance": true, "housekeeping": true, "analytics": "basic"}', 14
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Starter');

INSERT INTO plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
SELECT 'Growth', 199.00, 1990.00, 50, 15, '{"pos": true, "maintenance": true, "housekeeping": true, "analytics": "advanced"}', 14
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Growth');

INSERT INTO plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
SELECT 'Pro', 399.00, 3990.00, 200, 50, '{"pos": true, "maintenance": true, "housekeeping": true, "analytics": "premium", "api_access": true}', 14
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Pro');

-- Insert sample tenant (Grand Palace Lagos)
INSERT INTO tenants (
  hotel_name, hotel_slug, email, phone, address, city, country, currency, timezone,
  plan_id, subscription_status, setup_completed, brand_colors, settings
) 
SELECT 
  'Grand Palace Lagos', 'grand-palace-lagos', 'owner@grandpalacelagos.com',
  '+234 123 456 7890', '123 Victoria Island', 'Lagos', 'Nigeria', 'NGN', 'Africa/Lagos',
  p.id, 'active', true,
  '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#f59e0b"}',
  '{"onboarding_completed": true, "demo_data": true}'
FROM plans p 
WHERE p.name = 'Growth'
AND NOT EXISTS (SELECT 1 FROM tenants WHERE hotel_slug = 'grand-palace-lagos');