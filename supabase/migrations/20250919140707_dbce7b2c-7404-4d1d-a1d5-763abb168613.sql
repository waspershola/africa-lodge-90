-- Hotel Management System - Row Level Security (RLS) Policies  
-- Supabase PostgreSQL RLS Configuration v1.0
-- Execute this AFTER running 001_schema.sql

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TENANT-SCOPED TABLES
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_actions ENABLE ROW LEVEL SECURITY;

-- Global tables (no RLS needed)
-- - plans: Global configuration
-- - feature_flags: Global configuration

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Get user's tenant_id from JWT claims
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('jwt.claims.tenant_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role from JWT claims
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('jwt.claims.role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's ID from JWT
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access tenant data
CREATE OR REPLACE FUNCTION can_access_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin can access all tenants
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Users can only access their own tenant's data
  RETURN get_user_tenant_id() = tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

-- Super Admin can see all tenants
CREATE POLICY "Super admin can view all tenants" ON tenants
  FOR SELECT 
  USING (is_super_admin());

-- Users can only see their own tenant
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT 
  USING (get_user_tenant_id() = tenant_id);

-- Super admin can create tenants
CREATE POLICY "Super admin can create tenants" ON tenants
  FOR INSERT 
  WITH CHECK (is_super_admin());

-- Super admin can update any tenant, owners can update own tenant  
CREATE POLICY "Super admin can update all tenants" ON tenants
  FOR UPDATE 
  USING (is_super_admin());

CREATE POLICY "Owners can update own tenant" ON tenants
  FOR UPDATE 
  USING (get_user_role() = 'OWNER' AND get_user_tenant_id() = tenant_id);

-- ============================================================================
-- USERS TABLE POLICIES  
-- ============================================================================

-- Users can view users in their tenant + super admin sees all
CREATE POLICY "Users can view users in own tenant" ON users
  FOR SELECT
  USING (can_access_tenant(tenant_id) OR tenant_id IS NULL);

-- Super admin can insert users anywhere, others can only invite to own tenant
CREATE POLICY "Super admin can create users" ON users
  FOR INSERT 
  WITH CHECK (is_super_admin());

CREATE POLICY "Owners/managers can create users in own tenant" ON users
  FOR INSERT 
  WITH CHECK (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

-- Super admin can update any user, managers can update staff in own tenant
CREATE POLICY "Super admin can update users" ON users
  FOR UPDATE 
  USING (is_super_admin());

CREATE POLICY "Owners/managers can update users in own tenant" ON users
  FOR UPDATE 
  USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (get_user_id() = id);

-- ============================================================================
-- ROOM TYPES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view room types in own tenant" ON room_types
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Owners/managers can manage room types" ON room_types
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

-- ============================================================================
-- ROOMS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view rooms in own tenant" ON rooms
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can update room status" ON rooms
  FOR UPDATE USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Owners/managers can manage rooms" ON rooms
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

-- ============================================================================
-- RESERVATIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view reservations in own tenant" ON reservations
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage reservations" ON reservations
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- ============================================================================
-- BILLING TABLES POLICIES (FOLIOS, CHARGES, PAYMENTS)
-- ============================================================================

CREATE POLICY "Users can view folios in own tenant" ON folios
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage folios" ON folios
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Users can view folio charges in own tenant" ON folio_charges
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage folio charges" ON folio_charges
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Users can view payments in own tenant" ON payments
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage payments" ON payments
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- ============================================================================
-- QR SERVICES POLICIES
-- ============================================================================

CREATE POLICY "Users can view QR templates in own tenant" ON qr_templates
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Managers can manage QR templates" ON qr_templates
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Users can view QR codes in own tenant" ON qr_codes
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage QR codes" ON qr_codes
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- QR orders need special handling for anonymous guests
CREATE POLICY "Staff can view QR orders in own tenant" ON qr_orders
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage QR orders" ON qr_orders
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );

-- Allow anonymous users to create QR orders (guest requests)
CREATE POLICY "Allow anonymous QR order creation" ON qr_orders
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- HOUSEKEEPING POLICIES
-- ============================================================================

CREATE POLICY "Users can view housekeeping tasks in own tenant" ON housekeeping_tasks
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Housekeeping staff can manage tasks" ON housekeeping_tasks
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Users can view supplies in own tenant" ON supplies
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage supplies" ON supplies
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Users can view supply usage in own tenant" ON supply_usage
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage supply usage" ON supply_usage
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING') 
    AND get_user_tenant_id() = tenant_id
  );

-- ============================================================================
-- MAINTENANCE POLICIES
-- ============================================================================

CREATE POLICY "Users can view work orders in own tenant" ON work_orders
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage work orders" ON work_orders
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'MAINTENANCE', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- ============================================================================
-- POS SYSTEM POLICIES
-- ============================================================================

CREATE POLICY "Users can view menu categories in own tenant" ON menu_categories
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage menu categories" ON menu_categories
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Users can view menu items in own tenant" ON menu_items
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage menu items" ON menu_items
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );

CREATE POLICY "Users can view POS orders in own tenant" ON pos_orders
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage POS orders" ON pos_orders
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'POS', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

CREATE POLICY "Users can view audit logs in own tenant" ON audit_log
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "System can create audit entries" ON audit_log
  FOR INSERT WITH CHECK (can_access_tenant(tenant_id));

-- ============================================================================
-- OFFLINE ACTIONS POLICIES  
-- ============================================================================

CREATE POLICY "Users can view offline actions in own tenant" ON offline_actions
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage offline actions" ON offline_actions
  FOR ALL USING (can_access_tenant(tenant_id));

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on helper functions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_tenant(UUID) TO authenticated;