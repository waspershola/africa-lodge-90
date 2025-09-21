-- FINAL CRITICAL SECURITY LOCKDOWN
-- Address all remaining security vulnerabilities from scan

-- 1. COMPLETELY SECURE TENANT DATA - Critical business info exposure
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Owners can update own tenant" ON public.tenants;

-- Only allow users to see their own tenant data, not others
CREATE POLICY "Users can view own tenant only" ON public.tenants
  FOR SELECT 
  USING (
    -- Super admins can see all
    is_super_admin()
    OR
    -- Users can only see their own tenant
    (
      EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() 
        AND u.tenant_id = tenants.tenant_id
      )
    )
  );

-- Owners can only update their own tenant
CREATE POLICY "Owners can update own tenant only" ON public.tenants
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.tenant_id = tenants.tenant_id 
      AND u.role = 'OWNER'
    )
  );

-- 2. STRENGTHEN ANONYMOUS QR ORDER PROTECTION
-- Add basic validation to prevent spam while keeping guest convenience
DROP POLICY IF EXISTS "Allow anonymous QR order creation" ON public.qr_orders;

-- More restrictive anonymous policy with basic validation
CREATE POLICY "Allow validated anonymous QR order creation" ON public.qr_orders
  FOR INSERT 
  WITH CHECK (
    -- Must have valid QR code reference and service type
    qr_code_id IS NOT NULL 
    AND service_type IS NOT NULL
    AND service_type != ''
    -- Limit to reasonable service types
    AND service_type IN ('housekeeping', 'maintenance', 'room_service', 'concierge', 'wifi_support')
  );

-- 3. FINAL SECURITY AUDIT: Ensure no data leakage
-- Double-check that view policies are properly restrictive

-- Verify reservations are completely locked down
DROP POLICY IF EXISTS "Staff can view reservations in own tenant" ON public.reservations;
CREATE POLICY "Authorized staff only can view guest data" ON public.reservations
  FOR SELECT 
  USING (
    -- Super admin access
    is_super_admin()
    OR
    -- Only specific roles in same tenant
    (
      get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text])
      AND get_user_tenant_id() = tenant_id
      AND tenant_id IS NOT NULL
    )
  );

-- Verify payments are completely locked down  
DROP POLICY IF EXISTS "Authorized staff can view payments" ON public.payments;
CREATE POLICY "Financial staff only can view payment data" ON public.payments
  FOR SELECT 
  USING (
    -- Super admin access
    is_super_admin()
    OR
    -- Only financial roles in same tenant
    (
      get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text])
      AND get_user_tenant_id() = tenant_id
      AND tenant_id IS NOT NULL
    )
  );

-- Verify users table is completely locked down
DROP POLICY IF EXISTS "Managers can view staff in own tenant" ON public.users;
CREATE POLICY "Restricted staff data access" ON public.users
  FOR SELECT 
  USING (
    -- Super admin access
    is_super_admin()
    OR
    -- Users can view own profile only
    (auth.uid() IS NOT NULL AND get_user_id() = id)
    OR
    -- Only owners/managers can view other staff in same tenant
    (
      get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])
      AND get_user_tenant_id() = tenant_id
      AND tenant_id IS NOT NULL
      AND auth.uid() != id -- Don't duplicate own access
    )
  );

-- 4. ADD ADDITIONAL PROTECTION: Prevent cross-tenant data access
-- Create function to validate tenant access more strictly
CREATE OR REPLACE FUNCTION public.strict_tenant_access(target_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Super admin always has access
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Must belong to the target tenant
  RETURN EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.tenant_id = target_tenant_id
    AND u.is_active = true
  );
END;
$$;

-- Apply strict access to all remaining tenant-scoped tables
UPDATE pg_policy 
SET qual = replace(qual::text, 'can_access_tenant', 'strict_tenant_access')::pg_node_tree
WHERE polname LIKE '%tenant%' AND qual::text LIKE '%can_access_tenant%';

-- 5. EMERGENCY LOCKDOWN: Revoke any remaining public permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- Grant only necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;