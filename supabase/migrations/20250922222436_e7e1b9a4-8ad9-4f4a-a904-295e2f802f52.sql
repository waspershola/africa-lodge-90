-- Ensure we have the necessary global roles
INSERT INTO public.roles (name, description, scope, tenant_id, is_system) 
VALUES 
  ('Super Admin', 'Full control of the entire platform', 'global', NULL, true),
  ('Platform Admin', 'Limited global rights for platform management', 'global', NULL, true),
  ('Support Staff', 'Customer support access', 'global', NULL, true)
ON CONFLICT (name, scope) DO NOTHING
WHERE tenant_id IS NULL;