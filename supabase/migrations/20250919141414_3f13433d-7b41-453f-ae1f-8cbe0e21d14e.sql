-- Fix function search paths and add remaining RLS policies

-- Update function search paths to fix security warnings
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('jwt.claims.tenant_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('jwt.claims.role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add remaining policies for all tables

-- Reservations
CREATE POLICY "Users can view reservations in own tenant" ON reservations
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage reservations" ON reservations
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- Folios
CREATE POLICY "Users can view folios in own tenant" ON folios
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage folios" ON folios
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- Folio Charges
CREATE POLICY "Users can view folio charges in own tenant" ON folio_charges
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage folio charges" ON folio_charges
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );

-- Payments
CREATE POLICY "Users can view payments in own tenant" ON payments
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage payments" ON payments
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- QR Templates
CREATE POLICY "Users can view QR templates in own tenant" ON qr_templates
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Managers can manage QR templates" ON qr_templates
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

-- QR Codes
CREATE POLICY "Users can view QR codes in own tenant" ON qr_codes
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage QR codes" ON qr_codes
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- QR Orders (special handling for anonymous guests)
CREATE POLICY "Staff can view QR orders in own tenant" ON qr_orders
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage QR orders" ON qr_orders
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );
CREATE POLICY "Allow anonymous QR order creation" ON qr_orders
  FOR INSERT WITH CHECK (true);

-- Housekeeping Tasks
CREATE POLICY "Users can view housekeeping tasks in own tenant" ON housekeeping_tasks
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Housekeeping staff can manage tasks" ON housekeeping_tasks
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING') 
    AND get_user_tenant_id() = tenant_id
  );

-- Supplies
CREATE POLICY "Users can view supplies in own tenant" ON supplies
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage supplies" ON supplies
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING') 
    AND get_user_tenant_id() = tenant_id
  );

-- Supply Usage
CREATE POLICY "Users can view supply usage in own tenant" ON supply_usage
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage supply usage" ON supply_usage
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'HOUSEKEEPING') 
    AND get_user_tenant_id() = tenant_id
  );

-- Work Orders
CREATE POLICY "Users can view work orders in own tenant" ON work_orders
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage work orders" ON work_orders
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'MAINTENANCE', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- Menu Categories
CREATE POLICY "Users can view menu categories in own tenant" ON menu_categories
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage menu categories" ON menu_categories
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );

-- Menu Items  
CREATE POLICY "Users can view menu items in own tenant" ON menu_items
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage menu items" ON menu_items
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'POS') 
    AND get_user_tenant_id() = tenant_id
  );

-- POS Orders
CREATE POLICY "Users can view POS orders in own tenant" ON pos_orders
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage POS orders" ON pos_orders
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'POS', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- POS Order Items
CREATE POLICY "Users can view POS order items in own tenant" ON pos_order_items
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage POS order items" ON pos_order_items
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'POS', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- Audit Log
CREATE POLICY "Users can view audit logs in own tenant" ON audit_log
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "System can create audit entries" ON audit_log
  FOR INSERT WITH CHECK (can_access_tenant(tenant_id));

-- Offline Actions
CREATE POLICY "Users can view offline actions in own tenant" ON offline_actions
  FOR SELECT USING (can_access_tenant(tenant_id));
CREATE POLICY "Staff can manage offline actions" ON offline_actions
  FOR ALL USING (can_access_tenant(tenant_id));