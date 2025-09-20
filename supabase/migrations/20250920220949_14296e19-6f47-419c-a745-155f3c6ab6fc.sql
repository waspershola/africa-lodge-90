-- Update existing user to be SUPER_ADMIN
UPDATE public.users 
SET 
  role = 'SUPER_ADMIN',
  tenant_id = NULL,
  name = 'Super Admin',
  is_active = true,
  updated_at = now()
WHERE email = 'wasperstore@gmail.com';

-- Fix the INSERT policy for tenants 
DROP POLICY IF EXISTS "Super admin can create tenants" ON public.tenants;

CREATE POLICY "Super admin can create tenants" 
ON public.tenants 
FOR INSERT 
WITH CHECK (is_super_admin());