-- EMERGENCY FIX: Users and Tenants tables still exposed
-- Drop ALL existing policies and create completely restrictive ones

-- FIX USERS TABLE - Complete lockdown
DROP POLICY IF EXISTS "Deny anonymous access to users" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Restricted staff data access" ON public.users;

-- Create single, comprehensive policy for users table
CREATE POLICY "Complete users access control" ON public.users
  FOR ALL 
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    (
      -- Super admin access
      is_super_admin()
      OR
      -- Users can view/edit own profile
      (id = auth.uid())
      OR  
      -- Owners/managers can view staff in their tenant
      (
        get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])
        AND get_user_tenant_id() = tenant_id
        AND tenant_id IS NOT NULL
      )
    )
  )
  WITH CHECK (
    -- Same restrictions for INSERT/UPDATE
    auth.uid() IS NOT NULL
    AND
    (
      is_super_admin()
      OR
      (id = auth.uid())
      OR
      (
        get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])
        AND get_user_tenant_id() = tenant_id
        AND tenant_id IS NOT NULL
      )
    )
  );

-- FIX TENANTS TABLE - Complete lockdown  
DROP POLICY IF EXISTS "Super admin can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view own tenant only" ON public.tenants;
DROP POLICY IF EXISTS "Owners can update own tenant only" ON public.tenants;

-- Create single, comprehensive policy for tenants table
CREATE POLICY "Complete tenants access control" ON public.tenants
  FOR ALL
  USING (
    -- Must be authenticated  
    auth.uid() IS NOT NULL
    AND
    (
      -- Super admin access
      is_super_admin()
      OR
      -- Users can only view their own tenant
      EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() 
        AND u.tenant_id = tenants.tenant_id
        AND u.is_active = true
      )
    )
  )
  WITH CHECK (
    -- Same restrictions for INSERT/UPDATE
    auth.uid() IS NOT NULL
    AND
    (
      is_super_admin()
      OR
      EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() 
        AND u.tenant_id = tenants.tenant_id
        AND u.role = 'OWNER'
        AND u.is_active = true
      )
    )
  );