-- CORRECTED FINAL SECURITY LOCKDOWN
-- Fix remaining vulnerabilities without invalid operations

-- 1. SECURE TENANT DATA - Critical business info exposure
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Owners can update own tenant" ON public.tenants;

-- Only allow users to see their own tenant data
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

-- 2. STRENGTHEN QR ORDER PROTECTION
DROP POLICY IF EXISTS "Allow anonymous QR order creation" ON public.qr_orders;

-- Add validation to prevent QR order spam
CREATE POLICY "Allow validated QR order creation" ON public.qr_orders
  FOR INSERT 
  WITH CHECK (
    qr_code_id IS NOT NULL 
    AND service_type IS NOT NULL
    AND service_type != ''
    AND service_type IN ('housekeeping', 'maintenance', 'room_service', 'concierge', 'wifi_support')
  );

-- 3. CREATE STRICT TENANT ACCESS FUNCTION
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

-- 4. EMERGENCY PERMISSIONS LOCKDOWN
-- Revoke all public permissions first
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- Grant only necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. ENSURE EXISTING POLICIES ARE RESTRICTIVE ENOUGH
-- Update room policies to use strict access
DROP POLICY IF EXISTS "Staff can view rooms in own tenant" ON public.rooms;
CREATE POLICY "Staff can view rooms in own tenant" ON public.rooms
  FOR SELECT 
  USING (strict_tenant_access(tenant_id));

-- Update room_types policies  
DROP POLICY IF EXISTS "Staff can view room types in own tenant" ON public.room_types;
CREATE POLICY "Staff can view room types in own tenant" ON public.room_types
  FOR SELECT 
  USING (strict_tenant_access(tenant_id));