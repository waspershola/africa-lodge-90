-- CRITICAL SECURITY FIX: Secure Plans Table Access
-- This prevents competitors from accessing your pricing data

-- Remove the current overly permissive policy that allows anyone to view plans
DROP POLICY IF EXISTS "authenticated_users_can_view_plans" ON public.plans;

-- Create a new restrictive policy that requires authentication
CREATE POLICY "authenticated_users_only_plans" 
ON public.plans 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Keep super admin management access
DROP POLICY IF EXISTS "super_admin_full_access_plans" ON public.plans;
CREATE POLICY "super_admin_manage_plans" 
ON public.plans 
FOR ALL 
TO authenticated 
USING (is_super_admin());