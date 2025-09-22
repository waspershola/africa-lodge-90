-- Ensure we have a Basic plan for trials
INSERT INTO plans (name, max_rooms, max_staff, price_monthly, price_annual, features, trial_days)
VALUES (
  'Basic',
  50,
  10,
  99.00,
  990.00,
  '{
    "reservations": true,
    "staff_management": true,
    "basic_reporting": true,
    "email_support": true,
    "qr_codes": true,
    "pos_system": false,
    "advanced_reporting": false,
    "api_access": false
  }',
  14
)
ON CONFLICT (name) DO NOTHING;

-- Ensure we have all the global roles needed
INSERT INTO roles (name, description, scope, tenant_id, is_system) VALUES
  ('Super Admin', 'Platform super administrator with full access', 'global', null, true),
  ('Platform Admin', 'Platform administrator with limited access', 'global', null, true),
  ('Support Staff', 'Customer support staff', 'global', null, true),
  ('Sales', 'Sales team member', 'global', null, true)
ON CONFLICT (name, scope, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;