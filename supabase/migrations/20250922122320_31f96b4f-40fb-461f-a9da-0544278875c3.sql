-- Fix migration to use existing Starter plan instead of creating Basic plan
-- Remove Basic plan if it exists and ensure global roles exist

-- Delete Basic plan if it was created by previous migration
DELETE FROM plans WHERE name = 'Basic';

-- Ensure we have all the global roles needed (case-sensitive names to match database)
INSERT INTO roles (name, description, scope, tenant_id, is_system) VALUES
  ('Super Admin', 'Platform super administrator with full access', 'global', null, true),
  ('Platform Admin', 'Platform administrator with limited access', 'global', null, true),
  ('Support Staff', 'Customer support staff', 'global', null, true),
  ('Sales', 'Sales team member', 'global', null, true)
ON CONFLICT (name, scope, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;