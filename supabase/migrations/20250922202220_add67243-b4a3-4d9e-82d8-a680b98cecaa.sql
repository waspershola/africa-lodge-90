-- EMERGENCY SECURITY FIX: Lock down sensitive tables from anonymous access

-- Enable RLS on all sensitive tables (in case not enabled)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonations ENABLE ROW LEVEL SECURITY;

-- DROP and recreate restrictive policies to block anonymous access

-- 1. ROLES TABLE - Block anonymous, allow authenticated with proper scope
DROP POLICY IF EXISTS "Role managers can view roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;

CREATE POLICY "Authenticated users can view appropriate roles" 
ON public.roles 
FOR SELECT 
TO authenticated
USING (
  -- Super admins can see all roles
  is_super_admin() OR 
  -- Tenant users can see global roles and their own tenant roles  
  (scope = 'global'::role_scope AND auth.uid() IS NOT NULL) OR
  (scope = 'tenant'::role_scope AND strict_tenant_access(tenant_id))
);

-- 2. PERMISSIONS TABLE - Only authenticated users
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

CREATE POLICY "Authenticated users can view permissions" 
ON public.permissions 
FOR SELECT 
TO authenticated  
USING (auth.uid() IS NOT NULL);

-- 3. PLANS TABLE - Only authenticated users
DROP POLICY IF EXISTS "Authenticated users can view plans" ON public.plans;

CREATE POLICY "Authenticated users can view plans" 
ON public.plans 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 4. FEATURE_FLAGS TABLE - Only authenticated users 
DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;

CREATE POLICY "Authenticated users can view feature flags" 
ON public.feature_flags 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 5. ROLE_PERMISSIONS TABLE - Already has proper policies, ensure RLS enabled

-- 6. AUDIT_LOG TABLE - Already has proper policies, ensure RLS enabled

-- 7. IMPERSONATIONS TABLE - Already has proper policies, ensure RLS enabled

-- Add explicit DENY policy for anonymous users on all sensitive tables
CREATE POLICY "Block anonymous access to roles" 
ON public.roles 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Block anonymous access to permissions" 
ON public.permissions 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Block anonymous access to plans" 
ON public.plans 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Block anonymous access to feature_flags" 
ON public.feature_flags 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Block anonymous access to role_permissions" 
ON public.role_permissions 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Block anonymous access to audit_log" 
ON public.audit_log 
FOR ALL 
TO anon 
USING (false);

CREATE POLICY "Block anonymous access to impersonations" 
ON public.impersonations 
FOR ALL 
TO anon 
USING (false);