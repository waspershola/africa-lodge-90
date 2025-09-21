-- COMPLETE EMERGENCY LOCKDOWN
-- Drop ALL policies and create single restrictive ones

-- First, completely disable RLS temporarily to clean up
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (there might be duplicates/conflicts)
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    -- Drop all policies on users table
    FOR pol_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.users';
    END LOOP;
    
    -- Drop all policies on tenants table  
    FOR pol_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'tenants' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.tenants';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create single, iron-clad policies

-- USERS TABLE: Ultra-restrictive policy
CREATE POLICY "users_ultra_secure" ON public.users
  FOR ALL 
  TO authenticated  -- Only authenticated role
  USING (
    -- Super admin OR own profile OR manager viewing staff in same tenant
    is_super_admin()
    OR 
    (id = auth.uid())
    OR
    (
      get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])
      AND get_user_tenant_id() = tenant_id
      AND tenant_id IS NOT NULL
      AND auth.uid() IS NOT NULL
    )
  );

-- TENANTS TABLE: Ultra-restrictive policy  
CREATE POLICY "tenants_ultra_secure" ON public.tenants
  FOR ALL
  TO authenticated  -- Only authenticated role
  USING (
    -- Super admin OR user belongs to this tenant
    is_super_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.tenant_id = tenants.tenant_id
      AND u.is_active = true
    )
  );

-- Verify no access for anonymous users
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.tenants FROM anon;
REVOKE ALL ON public.users FROM public;  
REVOKE ALL ON public.tenants FROM public;