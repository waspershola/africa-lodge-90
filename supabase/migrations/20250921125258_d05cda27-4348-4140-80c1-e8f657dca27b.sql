-- Remove the temporary bypass policy
DROP POLICY IF EXISTS "Temporary bypass for debugging" ON public.tenants;

-- Fix the JWT claims by ensuring the custom access token hook sets the claims correctly
-- The issue is that PostgreSQL can't access JWT claims during RLS evaluation when using custom hooks
-- We need to use a different approach: store the user info in the database and query it directly

-- Update the RLS policies to use auth.uid() directly and query the users table
CREATE OR REPLACE FUNCTION public.is_super_admin_direct()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Query the users table directly using auth.uid()
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Update tenants RLS policies to use the direct database lookup
DROP POLICY IF EXISTS "Super admin can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Owners can update own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Super admin can update all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admin can create tenants" ON public.tenants;

-- Create new policies using direct database lookup
CREATE POLICY "Super admin can view all tenants" 
ON public.tenants 
FOR SELECT 
USING (is_super_admin_direct());

CREATE POLICY "Users can view own tenant" 
ON public.tenants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.tenant_id = tenants.tenant_id
  )
);

CREATE POLICY "Owners can update own tenant" 
ON public.tenants 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.tenant_id = tenants.tenant_id 
    AND u.role = 'OWNER'
  )
);

CREATE POLICY "Super admin can update all tenants" 
ON public.tenants 
FOR UPDATE 
USING (is_super_admin_direct());

CREATE POLICY "Super admin can create tenants" 
ON public.tenants 
FOR INSERT 
WITH CHECK (is_super_admin_direct());

-- Test the new function
SELECT is_super_admin_direct() as can_access_tenants;