-- FIX FINAL ROLE/PERMISSION EXPOSURE WARNINGS
-- Secure remaining publicly readable system tables

-- Fix roles table exposure (currently has policy allowing all authenticated users)
DROP POLICY IF EXISTS "Users can view roles in own tenant" ON public.roles;

-- Create more restrictive policy - only allow role management access
CREATE POLICY "Role managers can view roles" ON public.roles
  FOR SELECT 
  USING (
    -- Super admins can view all roles
    is_super_admin()
    OR
    -- Owners/managers can only view roles in their own tenant
    (
      scope = 'tenant'::role_scope 
      AND get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])
      AND strict_tenant_access(tenant_id)
    )
    OR
    -- Everyone can view global roles (needed for system functionality)
    (scope = 'global'::role_scope)
  );

-- Fix role_permissions table exposure
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;

-- Create restrictive policy for role permissions
CREATE POLICY "Role managers can view role permissions" ON public.role_permissions
  FOR SELECT 
  USING (
    -- Super admins can view all
    is_super_admin()
    OR
    -- Only owners/managers can view role permissions for their tenant roles
    EXISTS (
      SELECT 1 FROM public.roles r 
      WHERE r.id = role_permissions.role_id 
      AND (
        (r.scope = 'global'::role_scope) 
        OR 
        (
          r.scope = 'tenant'::role_scope 
          AND get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])
          AND strict_tenant_access(r.tenant_id)
        )
      )
    )
  );