-- Update pos_orders to include missing fields and complete POS system
UPDATE pos_orders SET
  subtotal = COALESCE(subtotal, 0),
  tax_amount = COALESCE(tax_amount, 0),
  service_charge = COALESCE(service_charge, 0),
  order_time = COALESCE(order_time, NOW()),
  updated_at = NOW()
WHERE id IS NOT NULL;

-- Add missing columns to pos_orders if they don't exist
ALTER TABLE pos_orders 
ADD COLUMN IF NOT EXISTS service_charge DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax_amount + service_charge) STORED,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS order_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS promised_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS taken_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS prepared_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS served_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS folio_id UUID REFERENCES folios(id);

-- Now create pos_order_items
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

-- Create remaining tables
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
  checklist JSONB DEFAULT '[]',
  
  -- Time tracking
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- References  
  created_by UUID REFERENCES users(id),
  qr_order_id UUID REFERENCES qr_orders(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('cleaning', 'linens', 'amenities', 'maintenance', 'consumables')),
  unit TEXT NOT NULL,
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  maximum_stock INTEGER,
  unit_cost DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supply_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES supplies(id),
  quantity_used INTEGER NOT NULL,
  room_id UUID REFERENCES rooms(id),
  task_id UUID REFERENCES housekeeping_tasks(id),
  used_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  work_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id),
  category TEXT NOT NULL
    CHECK (category IN ('electrical', 'plumbing', 'hvac', 'general', 'appliance', 'furniture')),
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  estimated_hours INTEGER,
  actual_hours INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  created_by UUID REFERENCES users(id),
  qr_order_id UUID REFERENCES qr_orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, work_order_number)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  data JSONB NOT NULL,
  sync_status TEXT DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict')),
  sync_attempted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  client_id TEXT,
  client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);