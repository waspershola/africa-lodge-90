-- Complete missing tables from 001_schema.sql

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
-- COMPLETE POS ORDER ITEMS TABLE
-- ============================================================================

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