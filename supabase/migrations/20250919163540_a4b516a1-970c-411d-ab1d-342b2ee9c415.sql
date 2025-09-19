-- Seed initial data for testing Phase 2 Backend Integration

-- Insert sample plans (only if they don't exist)
INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
SELECT 'Starter', 29.99, 299.99, 10, 5, '{"frontdesk": true, "housekeeping": true, "basic_reports": true}', 14
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Starter');

INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
SELECT 'Growth', 79.99, 799.99, 50, 20, '{"frontdesk": true, "housekeeping": true, "maintenance": true, "pos": true, "advanced_reports": true}', 14
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Growth');

INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
SELECT 'Pro', 149.99, 1499.99, 200, 100, '{"frontdesk": true, "housekeeping": true, "maintenance": true, "pos": true, "advanced_reports": true, "api_access": true, "custom_branding": true}', 14
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Pro');

-- Insert sample tenant (only if it doesn't exist)
INSERT INTO public.tenants (
  hotel_name, hotel_slug, email, phone, address, city, country, currency,
  plan_id, subscription_status, trial_end, brand_colors, settings
) 
SELECT 
  'Grand Palace Lagos', 'grand-palace-lagos', 'info@grandpalacelagos.com', '+234-123-456-7890',
  '123 Victoria Island', 'Lagos', 'Nigeria', 'NGN',
  (SELECT id FROM public.plans WHERE name = 'Growth' LIMIT 1),
  'trialing',
  (NOW() + INTERVAL '30 days'),
  '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#f59e0b"}',
  '{"checkin_auto_assign": true, "checkout_auto_clean": true}'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE hotel_slug = 'grand-palace-lagos');