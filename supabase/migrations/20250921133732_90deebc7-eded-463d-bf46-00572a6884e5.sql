-- First, create proper role and permission system (fixed syntax)

-- Drop existing role-related tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;

-- Create role scope enum (global vs tenant)
CREATE TYPE public.role_scope AS ENUM ('global', 'tenant');

-- Create role table for both global and tenant roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scope role_scope NOT NULL DEFAULT 'tenant',
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraints separately 
ALTER TABLE public.roles ADD CONSTRAINT roles_tenant_unique UNIQUE(name, tenant_id);
CREATE UNIQUE INDEX roles_global_unique ON public.roles(name) WHERE scope = 'global';
ALTER TABLE public.roles ADD CONSTRAINT roles_scope_tenant_check 
  CHECK ((scope = 'global' AND tenant_id IS NULL) OR (scope = 'tenant' AND tenant_id IS NOT NULL));

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL, -- e.g., 'reservations', 'billing', 'rooms'
  action TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'approve'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles table
CREATE POLICY "Super admin can manage all roles" ON public.roles
  FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view roles in own tenant" ON public.roles
  FOR SELECT USING (
    scope = 'global' OR 
    (scope = 'tenant' AND can_access_tenant(tenant_id))
  );

CREATE POLICY "Owners can manage tenant roles" ON public.roles
  FOR ALL USING (
    scope = 'tenant' AND 
    get_user_role() IN ('OWNER', 'MANAGER') AND 
    can_access_tenant(tenant_id)
  );

-- RLS policies for permissions table
CREATE POLICY "Everyone can view permissions" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "Super admin can manage permissions" ON public.permissions
  FOR ALL USING (is_super_admin());

-- RLS policies for role_permissions table
CREATE POLICY "Users can view role permissions" ON public.role_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.roles r 
      WHERE r.id = role_id AND (
        r.scope = 'global' OR 
        (r.scope = 'tenant' AND can_access_tenant(r.tenant_id))
      )
    )
  );

CREATE POLICY "Super admin can manage all role permissions" ON public.role_permissions
  FOR ALL USING (is_super_admin());

CREATE POLICY "Owners can manage tenant role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.roles r 
      WHERE r.id = role_id 
      AND r.scope = 'tenant' 
      AND get_user_role() IN ('OWNER', 'MANAGER')
      AND can_access_tenant(r.tenant_id)
    )
  );