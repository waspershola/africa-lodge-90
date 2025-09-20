-- Fix RLS policy for tenants table to allow super admin to see all tenants
DROP POLICY IF EXISTS "Super admin can view all tenants" ON public.tenants;

CREATE POLICY "Super admin can view all tenants" 
ON public.tenants 
FOR SELECT 
USING (
  NULLIF(current_setting('jwt.claims.role', true), '') = 'SUPER_ADMIN'
);