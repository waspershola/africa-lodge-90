-- Phase A Hotfixes: Add critical constraints and indexes

-- Add unique constraint for room numbers per tenant
ALTER TABLE rooms ADD CONSTRAINT unique_tenant_room_number UNIQUE (tenant_id, room_number);

-- Add unique constraint for QR code slugs per tenant  
ALTER TABLE qr_codes ADD CONSTRAINT unique_tenant_qr_slug UNIQUE (tenant_id, slug);

-- Add indexes for critical performance
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_dates ON reservations(tenant_id, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_status ON rooms(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date ON payments(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_folio_charges_folio ON folio_charges(folio_id);
CREATE INDEX IF NOT EXISTS idx_guests_tenant_email ON guests(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_tenant_status ON housekeeping_tasks(tenant_id, status);

-- Create rate_plans table for Rate Plan Manager
CREATE TABLE IF NOT EXISTS rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('seasonal', 'corporate', 'promotional', 'package')),
  room_type_id UUID REFERENCES room_types(id),
  base_rate NUMERIC NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('fixed', 'percentage')),
  adjustment NUMERIC NOT NULL DEFAULT 0,
  final_rate NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  min_stay INTEGER DEFAULT 1,
  max_stay INTEGER DEFAULT 30,
  advance_booking INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  restrictions TEXT[],
  corporate_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate_plans
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;

-- Add rate_plans policies
CREATE POLICY "Rate plans accessible by tenant" ON rate_plans
  FOR ALL USING (can_access_tenant(tenant_id));

-- Add index for rate_plans
CREATE INDEX idx_rate_plans_tenant_active ON rate_plans(tenant_id, is_active);
CREATE INDEX idx_rate_plans_dates ON rate_plans(start_date, end_date);

-- Add trigger for rate_plans updated_at
CREATE TRIGGER update_rate_plans_updated_at
  BEFORE UPDATE ON rate_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();