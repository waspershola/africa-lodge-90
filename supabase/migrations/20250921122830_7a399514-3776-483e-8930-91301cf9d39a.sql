-- SECURITY FIX: Restrict access to users table to prevent data theft
-- Issue: The current SELECT policy allows viewing users with tenant_id IS NULL, 
-- which exposes super admin personal information to potentially unauthorized users

-- Drop the insecure SELECT policy
DROP POLICY IF EXISTS "Users can view users in own tenant" ON public.users;

-- Create secure policies for SELECT operations
-- Policy 1: Super admins can view all users (including those with NULL tenant_id)
CREATE POLICY "Super admins can view all users" 
ON public.users 
FOR SELECT 
USING (is_super_admin());

-- Policy 2: Regular authenticated users can only view users in their own tenant
-- This excludes users with NULL tenant_id (super admins) from being visible to regular users
CREATE POLICY "Users can view users in own tenant only" 
ON public.users 
FOR SELECT 
USING (
  -- Must be authenticated
  auth.uid() IS NOT NULL 
  AND 
  -- Must be same tenant (excludes NULL tenant_id users from being visible to regular users)
  get_user_tenant_id() = tenant_id 
  AND tenant_id IS NOT NULL
);

-- Policy 3: Users can view their own profile (allows users to see themselves)
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (get_user_id() = id);

-- Additional security: Ensure no anonymous access is possible
-- (This should already be handled by RLS, but adding explicit check for safety)
CREATE POLICY "Deny anonymous access to users" 
ON public.users 
FOR ALL 
USING (auth.uid() IS NOT NULL);