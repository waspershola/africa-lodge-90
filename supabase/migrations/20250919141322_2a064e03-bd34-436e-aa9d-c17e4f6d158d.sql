-- Apply RLS policies now that all tables exist
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

-- Create helper functions for RLS policies
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('jwt.claims.tenant_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('jwt.claims.role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Tenant policies
CREATE POLICY "Super admin can view all tenants" ON tenants
  FOR SELECT USING (is_super_admin());
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT USING (get_user_tenant_id() = tenant_id);
CREATE POLICY "Super admin can create tenants" ON tenants
  FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Super admin can update all tenants" ON tenants
  FOR UPDATE USING (is_super_admin());
CREATE POLICY "Owners can update own tenant" ON tenants
  FOR UPDATE USING (get_user_role() = 'OWNER' AND get_user_tenant_id() = tenant_id);

-- Users policies
CREATE POLICY "Users can view users in own tenant" ON users
  FOR SELECT USING (can_access_tenant(tenant_id) OR tenant_id IS NULL);
CREATE POLICY "Super admin can create users" ON users
  FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Owners/managers can create users in own tenant" ON users
  FOR INSERT WITH CHECK (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );
CREATE POLICY "Super admin can update users" ON users
  FOR UPDATE USING (is_super_admin());
CREATE POLICY "Owners/managers can update users in own tenant" ON users
  FOR UPDATE USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (get_user_id() = id);

-- Room types policies
CREATE POLICY "Users can view room types in own tenant" ON room_types
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Owners/managers can manage room types" ON room_types
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

-- Rooms policies
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

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_tenant(UUID) TO authenticated;