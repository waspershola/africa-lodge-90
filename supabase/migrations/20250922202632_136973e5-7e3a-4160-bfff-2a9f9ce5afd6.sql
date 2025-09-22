-- Force stricter RLS by using proper role-based access
-- The issue might be that 'public' role includes anon, so we need to be more explicit

-- Update policies to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Only authenticated users can view permissions" 
ON public.permissions 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated users can view plans" ON public.plans;
CREATE POLICY "Only authenticated users can view plans" 
ON public.plans 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;
CREATE POLICY "Only authenticated users can view feature flags" 
ON public.feature_flags 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated users can view appropriate roles" ON public.roles;
CREATE POLICY "Only authenticated users can view appropriate roles" 
ON public.roles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND (
    -- Super admins can see all roles
    is_super_admin() OR 
    -- Tenant users can see global roles and their own tenant roles  
    (scope = 'global'::role_scope) OR
    (scope = 'tenant'::role_scope AND strict_tenant_access(tenant_id))
  )
);

-- Also ensure we revoke any default permissions on these tables
REVOKE ALL ON public.roles FROM anon;
REVOKE ALL ON public.permissions FROM anon;
REVOKE ALL ON public.plans FROM anon;
REVOKE ALL ON public.feature_flags FROM anon;
REVOKE ALL ON public.role_permissions FROM anon;
REVOKE ALL ON public.audit_log FROM anon;
REVOKE ALL ON public.impersonations FROM anon;

-- Grant only to authenticated users
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.feature_flags TO authenticated;