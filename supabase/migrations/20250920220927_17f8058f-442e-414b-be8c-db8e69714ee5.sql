-- Insert SUPER_ADMIN user into public.users table
INSERT INTO public.users (id, email, role, tenant_id, name, is_active, created_at, updated_at)
VALUES (
  '1debb8f1-ccfc-4edb-b187-0695eac42ae8',
  'wasperstore@gmail.com', 
  'SUPER_ADMIN',
  NULL,
  'Super Admin',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'SUPER_ADMIN',
  tenant_id = NULL,
  name = 'Super Admin',
  is_active = true;

-- Verify the INSERT policy for tenants has proper WITH CHECK
DROP POLICY IF EXISTS "Super admin can create tenants" ON public.tenants;

CREATE POLICY "Super admin can create tenants" 
ON public.tenants 
FOR INSERT 
WITH CHECK (is_super_admin());