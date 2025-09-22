-- Apply recommended indexes for better performance and RLS optimization
-- Using regular CREATE INDEX since CONCURRENTLY doesn't work in migration transactions

CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auditlog_tenant_id ON public.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auditlog_actor_id ON public.audit_log(actor_id);

-- Add performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_roles_name_scope ON public.roles(name, scope);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);

-- Add partial indexes for active users and roles
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(tenant_id, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_roles_active ON public.roles(scope, tenant_id) WHERE is_system = true;