-- Add performance indexes for user and role lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles (tenant_id);

-- Ensure we have the necessary global roles
INSERT INTO public.roles (name, description, scope, tenant_id, is_system) 
VALUES 
  ('Super Admin', 'Full control of the entire platform', 'global', NULL, true),
  ('Platform Admin', 'Limited global rights for platform management', 'global', NULL, true),
  ('Support Staff', 'Customer support access', 'global', NULL, true)
ON CONFLICT (name, scope, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;