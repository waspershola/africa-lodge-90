-- Allow tenant-scoped roles to have null tenant_id (for templates) or non-null (for actual tenant roles)
-- Global roles must still have null tenant_id
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_scope_tenant_check;

ALTER TABLE public.roles ADD CONSTRAINT roles_scope_tenant_check CHECK (
  (scope = 'global'::role_scope AND tenant_id IS NULL) OR
  (scope = 'tenant'::role_scope)
);