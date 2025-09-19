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

-- Super Admin can create tenants
CREATE POLICY "Super admin can create tenants" ON tenants
  FOR INSERT 
  WITH CHECK (is_super_admin());

-- Super Admin can update tenants
CREATE POLICY "Super admin can update tenants" ON tenants
  FOR UPDATE 
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Owner can view their own tenant
CREATE POLICY "Owner can view own tenant" ON tenants
  FOR SELECT 
  USING (
    get_user_role() = 'OWNER' 
    AND tenant_id = get_user_tenant_id()
  );

-- Owner can update their own tenant (limited fields)
CREATE POLICY "Owner can update own tenant" ON tenants
  FOR UPDATE 
  USING (
    get_user_role() = 'OWNER' 
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() = 'OWNER' 
    AND tenant_id = get_user_tenant_id()
  );

-- ============================================================================
-- USERS TABLE POLICIES  
-- ============================================================================

-- Super Admin can view all users
CREATE POLICY "Super admin can view all users" ON users
  FOR SELECT 
  USING (is_super_admin());

-- Super Admin can create users
CREATE POLICY "Super admin can create users" ON users
  FOR INSERT 
  WITH CHECK (is_super_admin());

-- Super Admin can update users  
CREATE POLICY "Super admin can update users" ON users
  FOR UPDATE 
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Tenant users can view users from same tenant
CREATE POLICY "Users can view same tenant users" ON users
  FOR SELECT 
  USING (can_access_tenant(tenant_id));

-- Owner/Manager can create users in their tenant
CREATE POLICY "Owner/Manager can create tenant users" ON users
  FOR INSERT 
  WITH CHECK (
    get_user_role() IN ('OWNER', 'MANAGER')
    AND can_access_tenant(tenant_id)
  );

-- Owner/Manager can update users in their tenant  
CREATE POLICY "Owner/Manager can update tenant users" ON users
  FOR UPDATE 
  USING (
    get_user_role() IN ('OWNER', 'MANAGER')
    AND can_access_tenant(tenant_id)
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'MANAGER')
    AND can_access_tenant(tenant_id)
  );

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (id = get_user_id());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (id = get_user_id())
  WITH CHECK (id = get_user_id());

-- ============================================================================
-- ROOMS & RESERVATIONS POLICIES (TENANT-SCOPED)
-- ============================================================================

-- Generic tenant-scoped policies for operational tables
CREATE POLICY "Tenant scoped select" ON room_types
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Tenant scoped insert" ON room_types  
  FOR INSERT WITH CHECK (can_access_tenant(tenant_id));
CREATE POLICY "Tenant scoped update" ON room_types
  FOR UPDATE USING (can_access_tenant(tenant_id)) WITH CHECK (can_access_tenant(tenant_id));

CREATE POLICY "Tenant scoped select" ON rooms
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Tenant scoped insert" ON rooms
  FOR INSERT WITH CHECK (can_access_tenant(tenant_id));
CREATE POLICY "Tenant scoped update" ON rooms
  FOR UPDATE USING (can_access_tenant(tenant_id)) WITH CHECK (can_access_tenant(tenant_id));

CREATE POLICY "Tenant scoped select" ON reservations
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Tenant scoped insert" ON reservations
  FOR INSERT WITH CHECK (can_access_tenant(tenant_id));
CREATE POLICY "Tenant scoped update" ON reservations
  FOR UPDATE USING (can_access_tenant(tenant_id)) WITH CHECK (can_access_tenant(tenant_id));

-- ============================================================================
-- BILLING POLICIES (TENANT-SCOPED WITH ROLE RESTRICTIONS)
-- ============================================================================

-- Folios - Financial data requires higher permissions
CREATE POLICY "Financial users can view folios" ON folios
  FOR SELECT USING (
    can_access_tenant(tenant_id) 
    AND get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT')
  );

CREATE POLICY "Financial users can manage folios" ON folios
  FOR ALL USING (
    can_access_tenant(tenant_id) 
    AND get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK')
  );

-- Folio Charges
CREATE POLICY "Staff can view charges" ON folio_charges
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Authorized staff can add charges" ON folio_charges
  FOR INSERT WITH CHECK (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'POS')
  );

-- Payments - Restricted to financial roles
CREATE POLICY "Financial users can view payments" ON payments
  FOR SELECT USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK')
  );

CREATE POLICY "Financial users can record payments" ON payments
  FOR INSERT WITH CHECK (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK')
  );

-- ============================================================================
-- QR SERVICES POLICIES
-- ============================================================================

-- QR Templates - Owner/Manager only
CREATE POLICY "Manager can manage QR templates" ON qr_templates
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER')
  );

-- QR Codes - Staff can view, Manager can manage
CREATE POLICY "Staff can view QR codes" ON qr_codes
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Manager can manage QR codes" ON qr_codes
  FOR INSERT WITH CHECK (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER')
  );

CREATE POLICY "Manager can update QR codes" ON qr_codes
  FOR UPDATE USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER')
  ) WITH CHECK (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER')
  );

-- QR Orders - All staff can view and update (for assignment)
CREATE POLICY "Staff can view QR orders" ON qr_orders
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Guest can create QR orders" ON qr_orders
  FOR INSERT WITH CHECK (can_access_tenant(tenant_id));

CREATE POLICY "Staff can update QR orders" ON qr_orders
  FOR UPDATE USING (can_access_tenant(tenant_id)) 
  WITH CHECK (can_access_tenant(tenant_id));

-- ============================================================================
-- HOUSEKEEPING POLICIES (ROLE-BASED)
-- ============================================================================

-- Housekeeping Tasks
CREATE POLICY "Staff can view housekeeping tasks" ON housekeeping_tasks
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Housekeeping staff can manage tasks" ON housekeeping_tasks
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING')
  );

-- Supplies  
CREATE POLICY "Staff can view supplies" ON supplies
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Housekeeping/Manager can manage supplies" ON supplies
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING')
  );

-- Supply Usage
CREATE POLICY "Staff can view supply usage" ON supply_usage
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Housekeeping can record usage" ON supply_usage
  FOR INSERT WITH CHECK (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING')
  );

-- ============================================================================
-- MAINTENANCE POLICIES (ROLE-BASED)
-- ============================================================================

-- Work Orders
CREATE POLICY "Staff can view work orders" ON work_orders
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Maintenance staff can manage work orders" ON work_orders
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'MAINTENANCE')
  );

-- ============================================================================
-- POS POLICIES (ROLE-BASED)  
-- ============================================================================

-- Menu Categories & Items
CREATE POLICY "Staff can view menu" ON menu_categories
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Manager/POS can manage menu categories" ON menu_categories
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'POS')
  );

CREATE POLICY "Staff can view menu items" ON menu_items
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Manager/POS can manage menu items" ON menu_items
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'POS')
  );

-- POS Orders
CREATE POLICY "Staff can view POS orders" ON pos_orders
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "POS staff can manage orders" ON pos_orders
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'POS', 'FRONT_DESK')
  );

CREATE POLICY "Staff can view order items" ON pos_order_items
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "POS staff can manage order items" ON pos_order_items
  FOR ALL USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER', 'POS', 'FRONT_DESK')
  );

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Audit Log - View permissions based on role
CREATE POLICY "Super admin can view all audit logs" ON audit_log
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Owner/Manager can view tenant audit logs" ON audit_log
  FOR SELECT USING (
    can_access_tenant(tenant_id)
    AND get_user_role() IN ('OWNER', 'MANAGER')
  );

-- All authenticated users can insert audit logs (system generated)
CREATE POLICY "Authenticated users can insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (
    CASE 
      WHEN tenant_id IS NULL THEN is_super_admin()
      ELSE can_access_tenant(tenant_id)
    END
  );

-- ============================================================================
-- OFFLINE SYNC POLICIES
-- ============================================================================

-- Offline Actions - Users can manage their own tenant's sync queue
CREATE POLICY "Users can view tenant offline actions" ON offline_actions
  FOR SELECT USING (can_access_tenant(tenant_id));

CREATE POLICY "Users can create offline actions" ON offline_actions
  FOR INSERT WITH CHECK (can_access_tenant(tenant_id));

CREATE POLICY "Users can update offline actions" ON offline_actions
  FOR UPDATE USING (can_access_tenant(tenant_id))
  WITH CHECK (can_access_tenant(tenant_id));

-- ============================================================================
-- SPECIAL POLICIES FOR GUEST ACCESS (QR Orders)
-- ============================================================================

-- Allow anonymous QR order creation (bypasses RLS for specific use case)
-- This should be handled via a secure API endpoint that validates QR tokens
-- and sets appropriate tenant context

-- Create a special role for QR guest access
CREATE ROLE qr_guest_role;

-- Grant minimal permissions to QR guest role
GRANT INSERT ON qr_orders TO qr_guest_role;
GRANT SELECT ON qr_codes TO qr_guest_role;

-- Special policy for QR guest access (disabled RLS for this specific case)
ALTER TABLE qr_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

-- Re-enable with guest-aware policies
ALTER TABLE qr_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policy that allows QR guests to create orders via API
CREATE POLICY "QR guest can create orders" ON qr_orders
  FOR INSERT WITH CHECK (
    -- This will be validated in the API endpoint
    qr_code_id IS NOT NULL
  );

-- ============================================================================
-- VALIDATION FUNCTIONS FOR BUSINESS RULES
-- ============================================================================

-- Prevent overlapping reservations
CREATE OR REPLACE FUNCTION check_room_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if room is available for the requested dates
  IF EXISTS (
    SELECT 1 FROM reservations 
    WHERE room_id = NEW.room_id
      AND status NOT IN ('cancelled', 'checked_out')
      AND (
        (NEW.check_in_date BETWEEN check_in_date AND check_out_date - INTERVAL '1 day')
        OR (NEW.check_out_date BETWEEN check_in_date + INTERVAL '1 day' AND check_out_date)
        OR (check_in_date BETWEEN NEW.check_in_date AND NEW.check_out_date - INTERVAL '1 day')
      )
      AND (TG_OP = 'INSERT' OR id != NEW.id)
  ) THEN
    RAISE EXCEPTION 'Room is not available for the selected dates';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reservation_availability
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION check_room_availability();

-- Ensure tenant isolation in all operations
CREATE OR REPLACE FUNCTION enforce_tenant_isolation()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure new records have correct tenant_id
  IF TG_OP = 'INSERT' THEN
    IF NEW.tenant_id != get_user_tenant_id() AND NOT is_super_admin() THEN
      RAISE EXCEPTION 'Cannot create records for different tenant';
    END IF;
  END IF;
  
  -- Prevent changing tenant_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.tenant_id != NEW.tenant_id AND NOT is_super_admin() THEN
      RAISE EXCEPTION 'Cannot change tenant_id';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply tenant isolation trigger to key tables
CREATE TRIGGER enforce_tenant_isolation_rooms
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();

CREATE TRIGGER enforce_tenant_isolation_reservations  
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();

-- ============================================================================
-- SECURITY GRANTS
-- ============================================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated; 
GRANT EXECUTE ON FUNCTION get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_tenant(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_user_tenant_id() IS 'Extract tenant_id from JWT claims for RLS policies';
COMMENT ON FUNCTION get_user_role() IS 'Extract user role from JWT claims for RLS policies';
COMMENT ON FUNCTION is_super_admin() IS 'Check if current user is super admin';
COMMENT ON FUNCTION can_access_tenant(UUID) IS 'Check if user can access tenant data';

-- RLS Policies are now configured
-- Next: Configure Supabase project settings per supabase_setup.md