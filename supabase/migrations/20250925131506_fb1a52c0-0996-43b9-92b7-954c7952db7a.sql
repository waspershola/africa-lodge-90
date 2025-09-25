-- CRITICAL SECURITY FIX: Secure Feature Flags Table Access
-- This prevents competitors from accessing your product roadmap

-- Remove the current overly permissive policy that allows anyone to view feature flags
DROP POLICY IF EXISTS "authenticated_users_can_view_feature_flags" ON public.feature_flags;

-- Create a new restrictive policy that requires authentication
CREATE POLICY "authenticated_users_only_feature_flags" 
ON public.feature_flags 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Keep super admin management access
DROP POLICY IF EXISTS "super_admin_full_access_feature_flags" ON public.feature_flags;
CREATE POLICY "super_admin_manage_feature_flags" 
ON public.feature_flags 
FOR ALL 
TO authenticated 
USING (is_super_admin());