-- Hotel Management System - Database Schema
-- Supabase PostgreSQL Migration v1.0
-- Execute this after enabling RLS policies in 002_rls_policies.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================================
-- TENANTS & USERS TABLES
-- ============================================================================

-- Plans table (global, not tenant-scoped)
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_annual DECIMAL(10,2),
  max_rooms INTEGER NOT NULL,
  max_staff INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  trial_days INTEGER DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants (hotels)
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hotel_name TEXT NOT NULL,
  hotel_slug TEXT UNIQUE NOT NULL,
  plan_id UUID NOT NULL REFERENCES plans(id),
  subscription_status TEXT NOT NULL DEFAULT 'trialing' 
    CHECK (subscription_status IN ('trialing', 'active', 'expired', 'suspended')),
  trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  setup_completed BOOLEAN DEFAULT FALSE,
  onboarding_step TEXT DEFAULT 'hotel_information',
  
  -- Hotel Information
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Nigeria',
  timezone TEXT DEFAULT 'Africa/Lagos',
  phone TEXT,
  email TEXT,
  currency TEXT DEFAULT 'NGN',
  
  -- Branding
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{}',
  receipt_template TEXT DEFAULT 'default',
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (staff members)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL 
    CHECK (role IN ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS')),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Profile
  name TEXT,
  phone TEXT,
  department TEXT,
  shift_start TIME,
  shift_end TIME,
  
  -- Auth flags
  force_reset BOOLEAN DEFAULT FALSE,
  temp_password_hash TEXT,
  temp_expires TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Super Admin users don't need tenant_id
  CONSTRAINT users_tenant_required 
    CHECK (role = 'SUPER_ADMIN' OR tenant_id IS NOT NULL)
);

-- ============================================================================
-- HOTEL OPERATIONS TABLES  
-- ============================================================================

-- Room Types
CREATE TABLE IF NOT EXISTS room_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_rate DECIMAL(10,2) NOT NULL,
  max_occupancy INTEGER DEFAULT 2,
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  floor INTEGER,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'maintenance', 'checkout', 'out_of_service')),
  
  -- Room details  
  notes TEXT,
  last_cleaned TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, room_number)
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  reservation_number TEXT NOT NULL,
  
  -- Guest details
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_id_number TEXT,
  
  -- Reservation details
  room_id UUID NOT NULL REFERENCES rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  
  -- Rates and charges
  room_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  
  -- Timestamps
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  
  -- Staff references
  created_by UUID REFERENCES users(id),
  checked_in_by UUID REFERENCES users(id),
  checked_out_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, reservation_number)
);

-- ============================================================================
-- BILLING & PAYMENTS TABLES
-- ============================================================================

-- Guest Folios (bills)
CREATE TABLE IF NOT EXISTS folios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  folio_number TEXT NOT NULL,
  
  -- Current balance
  total_charges DECIMAL(10,2) DEFAULT 0,
  total_payments DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (total_charges - total_payments) STORED,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'transferred')),
  
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, folio_number)
);

-- Folio Charges (line items)
CREATE TABLE IF NOT EXISTS folio_charges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  folio_id UUID NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
  
  -- Charge details
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  charge_type TEXT NOT NULL
    CHECK (charge_type IN ('room', 'food', 'beverage', 'service', 'tax', 'fee', 'other')),
  
  -- References
  reference_type TEXT, -- 'pos_order', 'qr_order', 'manual'
  reference_id UUID,   -- Links to POS order, QR order, etc.
  
  -- Staff reference
  posted_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  folio_id UUID NOT NULL REFERENCES folios(id),
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit', 'complimentary')),
  
  -- Payment references
  reference TEXT, -- Transaction ID, check number, etc.
  card_last_four TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Staff reference
  processed_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QR SERVICES TABLES
-- ============================================================================

-- QR Templates (service configurations)
CREATE TABLE IF NOT EXISTS qr_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  services TEXT[] NOT NULL, -- ['housekeeping', 'maintenance', 'room_service']
  template_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Codes (per room)
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id),
  template_id UUID REFERENCES qr_templates(id),
  
  -- QR Code data
  qr_token TEXT UNIQUE NOT NULL, -- Secure token for QR URLs
  qr_code_url TEXT, -- Generated QR image URL
  
  -- Services enabled
  services TEXT[] NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Orders (guest requests via QR)
CREATE TABLE IF NOT EXISTS qr_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id),
  
  -- Guest session (anonymous)
  guest_session_id TEXT,
  
  -- Service request
  service_type TEXT NOT NULL
    CHECK (service_type IN ('housekeeping', 'maintenance', 'room_service', 'wifi_access')),
  request_details JSONB DEFAULT '{}',
  
  -- Status and assignment
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- HOUSEKEEPING TABLES  
-- ============================================================================

-- Housekeeping Tasks
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Task details
  task_type TEXT NOT NULL
    CHECK (task_type IN ('cleaning', 'maintenance', 'inspection', 'supply_restock', 'deep_clean')),
  room_id UUID REFERENCES rooms(id),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Status and priority
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Checklist
  checklist JSONB DEFAULT '[]', -- Array of checklist items
  
  -- Time tracking
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- References  
  created_by UUID REFERENCES users(id),
  qr_order_id UUID REFERENCES qr_orders(id), -- If created from QR request
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply Items
CREATE TABLE IF NOT EXISTS supplies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Item details
  name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('cleaning', 'linens', 'amenities', 'maintenance', 'consumables')),
  unit TEXT NOT NULL, -- 'pieces', 'bottles', 'kg', etc.
  
  -- Inventory
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  maximum_stock INTEGER,
  unit_cost DECIMAL(10,2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply Usage (tracking)
CREATE TABLE IF NOT EXISTS supply_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES supplies(id),
  
  -- Usage details
  quantity_used INTEGER NOT NULL,
  room_id UUID REFERENCES rooms(id),
  task_id UUID REFERENCES housekeeping_tasks(id),
  
  -- Staff reference
  used_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MAINTENANCE TABLES
-- ============================================================================

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  work_order_number TEXT NOT NULL,
  
  -- Work order details  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id),
  category TEXT NOT NULL
    CHECK (category IN ('electrical', 'plumbing', 'hvac', 'general', 'appliance', 'furniture')),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Status and priority
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Time and cost tracking
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  estimated_hours INTEGER,
  actual_hours INTEGER,
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  -- References
  created_by UUID REFERENCES users(id),
  qr_order_id UUID REFERENCES qr_orders(id), -- If created from QR request
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, work_order_number)
);

-- ============================================================================
-- POS SYSTEM TABLES
-- ============================================================================

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id),
  
  -- Item details
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  
  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  preparation_time INTEGER, -- minutes
  
  -- Categorization
  tags TEXT[],
  dietary_info TEXT[], -- 'vegetarian', 'vegan', 'gluten-free', etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS Orders
CREATE TABLE IF NOT EXISTS pos_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  
  -- Order details
  room_id UUID REFERENCES rooms(id),
  order_type TEXT NOT NULL
    CHECK (order_type IN ('room_service', 'restaurant', 'bar', 'takeout')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  service_charge DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax_amount + service_charge) STORED,
  
  -- Special requests
  special_instructions TEXT,
  
  -- Time tracking
  order_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  promised_time TIMESTAMP WITH TIME ZONE,
  completed_time TIMESTAMP WITH TIME ZONE,
  
  -- Staff references
  taken_by UUID REFERENCES users(id),
  prepared_by UUID REFERENCES users(id),
  served_by UUID REFERENCES users(id),
  
  -- Payment
  folio_id UUID REFERENCES folios(id), -- If charged to room
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, order_number)
);

-- POS Order Items
CREATE TABLE IF NOT EXISTS pos_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  
  -- Item details (snapshot at time of order)
  item_name TEXT NOT NULL,
  item_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (item_price * quantity) STORED,
  
  -- Customizations
  special_requests TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT & SYSTEM TABLES
-- ============================================================================

-- Audit Log (comprehensive activity tracking)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE, -- NULL for super admin actions
  
  -- Actor details
  actor_id UUID REFERENCES users(id),
  actor_email TEXT,
  actor_role TEXT,
  
  -- Action details  
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'CHECKOUT', etc.
  resource_type TEXT NOT NULL, -- 'reservation', 'payment', 'room', etc.
  resource_id UUID,
  
  -- Change details
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature Flags (global system configuration)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flag_name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  
  -- Targeting
  target_tenants UUID[], -- Specific tenants, NULL = all
  target_plans TEXT[],   -- Specific plans, NULL = all
  
  -- Configuration
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline Action Queue (for sync)
CREATE TABLE IF NOT EXISTS offline_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Action details
  action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id UUID,
  
  -- Data payload
  data JSONB NOT NULL,
  
  -- Sync status
  sync_status TEXT DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict')),
  sync_attempted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Client info
  client_id TEXT, -- Device/browser identifier
  client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tenant-scoped indexes (most important for multi-tenant performance)
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON rooms(tenant_id);  
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_id ON reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_folios_tenant_id ON folios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_id ON qr_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_id ON qr_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_tenant_id ON housekeeping_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_tenant_id ON pos_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);

-- Frequently queried fields
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_qr_orders_status ON qr_orders(status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_status ON housekeeping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_pos_orders_status ON pos_orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_folios_reservation_id ON folios(reservation_id);
CREATE INDEX IF NOT EXISTS idx_folio_charges_folio_id ON folio_charges(folio_id);
CREATE INDEX IF NOT EXISTS idx_payments_folio_id ON payments(folio_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;   
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Folio balance trigger (update totals when charges/payments change)
CREATE OR REPLACE FUNCTION update_folio_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update folio totals when charges or payments change
    IF TG_TABLE_NAME = 'folio_charges' THEN
        UPDATE folios 
        SET total_charges = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM folio_charges 
            WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
        )
        WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
    END IF;
    
    IF TG_TABLE_NAME = 'payments' THEN
        UPDATE folios 
        SET total_payments = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
              AND status = 'completed'
        )
        WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER folio_charges_update_totals 
  AFTER INSERT OR UPDATE OR DELETE ON folio_charges
  FOR EACH ROW EXECUTE FUNCTION update_folio_totals();
  
CREATE TRIGGER payments_update_totals 
  AFTER INSERT OR UPDATE OR DELETE ON payments  
  FOR EACH ROW EXECUTE FUNCTION update_folio_totals();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default plans
INSERT INTO plans (id, name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Starter', 25000.00, 250000.00, 25, 10, 
 '{"qr_services": true, "basic_pos": true, "housekeeping": true, "basic_reports": true}', 14),
('550e8400-e29b-41d4-a716-446655440001', 'Growth', 50000.00, 500000.00, 75, 25,
 '{"qr_services": true, "advanced_pos": true, "housekeeping": true, "maintenance": true, "advanced_reports": true, "multi_currency": true}', 14),  
('550e8400-e29b-41d4-a716-446655440002', 'Enterprise', 100000.00, 1000000.00, 500, 100,
 '{"qr_services": true, "full_pos": true, "housekeeping": true, "maintenance": true, "advanced_reports": true, "multi_currency": true, "api_access": true, "custom_integrations": true}', 30)
ON CONFLICT (id) DO NOTHING;

-- Insert feature flags
INSERT INTO feature_flags (flag_name, description, is_enabled, config) VALUES
('offline_sync', 'Enable offline synchronization for staff apps', true, '{"sync_interval": 30}'),
('advanced_analytics', 'Enable advanced reporting and analytics', true, '{}'),
('qr_ordering', 'Enable QR code guest ordering system', true, '{}'),
('payment_integrations', 'Enable Paystack and Stripe integrations', true, '{}'),
('multi_currency', 'Enable multi-currency support', false, '{"default_currency": "NGN"}')
ON CONFLICT (flag_name) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION  
-- ============================================================================

COMMENT ON TABLE tenants IS 'Hotels/properties in the system';
COMMENT ON TABLE users IS 'Staff members and system users';  
COMMENT ON TABLE rooms IS 'Hotel rooms and their current status';
COMMENT ON TABLE reservations IS 'Guest reservations and bookings';
COMMENT ON TABLE folios IS 'Guest bills and account summaries';
COMMENT ON TABLE qr_orders IS 'Guest service requests via QR codes';
COMMENT ON TABLE housekeeping_tasks IS 'Housekeeping and cleaning tasks';
COMMENT ON TABLE work_orders IS 'Maintenance work orders';
COMMENT ON TABLE pos_orders IS 'Point of sale orders (food, beverage)';
COMMENT ON TABLE audit_log IS 'Comprehensive system activity log';
COMMENT ON TABLE offline_actions IS 'Queue for offline synchronization';

-- Schema creation complete
-- Next: Execute 002_rls_policies.sql for security