-- Fix critical security vulnerability: Remove public access to tenants table
-- Drop the dangerous policy that allows public access to all tenant data
DROP POLICY IF EXISTS "Public can view basic tenant info" ON public.tenants;

-- The existing "tenants_ultra_secure" policy is good and provides proper access control:
-- - Super admins can access all tenants
-- - Regular users can only access their own tenant data
-- - Anonymous users have no access

-- Verify the secure policy exists (this should already be in place)
DO $$
BEGIN
  -- Check if the secure policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tenants' 
    AND policyname = 'tenants_ultra_secure'
  ) THEN
    -- Create the secure policy
    EXECUTE 'CREATE POLICY "tenants_ultra_secure" ON public.tenants 
      FOR ALL 
      TO authenticated 
      USING (is_super_admin() OR (EXISTS ( 
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.tenant_id = tenants.tenant_id 
        AND u.is_active = true
      )))';
  END IF;
END $$;

-- Add audit log entry for this security fix
INSERT INTO public.audit_log (
  actor_id,
  actor_email,
  action,
  resource_type,
  description,
  metadata
) VALUES (
  auth.uid(),
  COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'system'),
  'SECURITY_FIX',
  'RLS_POLICY',
  'Removed dangerous public access policy from tenants table',
  jsonb_build_object(
    'removed_policy', 'Public can view basic tenant info',
    'security_level', 'CRITICAL',
    'fix_applied', now()
  )
);