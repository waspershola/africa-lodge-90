-- CRITICAL RLS SECURITY FIXES
-- Fix exposed sensitive data vulnerabilities found in security scan

-- 1. FIX GUEST PERSONAL INFORMATION EXPOSURE (reservations table)
-- Drop overly permissive policies and create strict ones
DROP POLICY IF EXISTS "Users can view reservations in own tenant" ON public.reservations;

-- Only allow specific roles to access guest data
CREATE POLICY "Staff can view reservations in own tenant" ON public.reservations
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text])) 
    AND (get_user_tenant_id() = tenant_id)
  );

-- 2. FIX STAFF PERSONAL DATA EXPOSURE (users table) 
-- Update existing policies to be more restrictive
DROP POLICY IF EXISTS "Users can view users in own tenant only" ON public.users;

-- Create more restrictive policy for viewing other users
CREATE POLICY "Managers can view staff in own tenant" ON public.users
  FOR SELECT 
  USING (
    -- Users can always view their own profile
    (get_user_id() = id) 
    OR 
    -- Only owners/managers can view other users in their tenant
    (
      (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])) 
      AND (get_user_tenant_id() = tenant_id) 
      AND (tenant_id IS NOT NULL)
    )
    OR
    -- Super admins can view all
    is_super_admin()
  );

-- 3. FIX FINANCIAL RECORDS EXPOSURE
-- Restrict folio access to authorized financial roles only
DROP POLICY IF EXISTS "Users can view folios in own tenant" ON public.folios;
CREATE POLICY "Financial staff can view folios" ON public.folios
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text])) 
    AND (get_user_tenant_id() = tenant_id)
  );

-- Restrict folio charges access
DROP POLICY IF EXISTS "Users can view folio charges in own tenant" ON public.folio_charges;
CREATE POLICY "Financial staff can view folio charges" ON public.folio_charges
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text])) 
    AND (get_user_tenant_id() = tenant_id)
  );

-- Restrict payments access - most sensitive
DROP POLICY IF EXISTS "Users can view payments in own tenant" ON public.payments;
CREATE POLICY "Authorized staff can view payments" ON public.payments
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text])) 
    AND (get_user_tenant_id() = tenant_id)
  );

-- 4. STRENGTHEN TENANT ISOLATION
-- Ensure all operational tables have proper tenant isolation
DROP POLICY IF EXISTS "Users can view rooms in own tenant" ON public.rooms;
CREATE POLICY "Staff can view rooms in own tenant" ON public.rooms
  FOR SELECT 
  USING (can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "Users can view room types in own tenant" ON public.room_types;  
CREATE POLICY "Staff can view room types in own tenant" ON public.room_types
  FOR SELECT 
  USING (can_access_tenant(tenant_id));

-- Restrict QR code access to relevant staff
DROP POLICY IF EXISTS "Users can view QR codes in own tenant" ON public.qr_codes;
CREATE POLICY "Staff can view QR codes in own tenant" ON public.qr_codes
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text, 'HOUSEKEEPING'::text])) 
    AND (get_user_tenant_id() = tenant_id)
  );

-- Restrict housekeeping tasks to relevant staff
DROP POLICY IF EXISTS "Users can view housekeeping tasks in own tenant" ON public.housekeeping_tasks;
CREATE POLICY "Housekeeping staff can view tasks in own tenant" ON public.housekeeping_tasks
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'HOUSEKEEPING'::text, 'FRONT_DESK'::text])) 
    AND (get_user_tenant_id() = tenant_id)
  );

-- Restrict work orders to maintenance and management
DROP POLICY IF EXISTS "Users can view work orders in own tenant" ON public.work_orders;
CREATE POLICY "Maintenance staff can view work orders in own tenant" ON public.work_orders
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'MAINTENANCE'::text, 'FRONT_DESK'::text])) 
    AND (get_user_tenant_id() = tenant_id)
  );

-- 5. ADDITIONAL SECURITY: Restrict audit log access
DROP POLICY IF EXISTS "Users can view audit logs in own tenant" ON public.audit_log;
CREATE POLICY "Managers can view audit logs in own tenant" ON public.audit_log
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])) 
    AND can_access_tenant(tenant_id)
  );