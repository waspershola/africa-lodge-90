-- Phase 1: Core Tenant Infrastructure & Security
-- Performance indexes for critical queries

-- Reservations performance index
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_dates 
ON reservations(tenant_id, check_in_date, check_out_date, status);

-- Payments performance index  
CREATE INDEX IF NOT EXISTS idx_payments_tenant_created 
ON payments(tenant_id, created_at, payment_method);

-- Folio charges performance index
CREATE INDEX IF NOT EXISTS idx_folio_charges_folio_posted 
ON folio_charges(folio_id, created_at);

-- Users tenant index
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Roles tenant index  
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);

-- Housekeeping tasks performance index
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_tenant_status 
ON housekeeping_tasks(tenant_id, status, assigned_to);

-- QR codes performance index
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_active 
ON qr_codes(tenant_id, is_active);

-- QR orders performance index
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_status 
ON qr_orders(tenant_id, status, assigned_to);

-- Guests email index for lookups
CREATE INDEX IF NOT EXISTS idx_guests_tenant_email 
ON guests(tenant_id, email);

-- Work orders performance index
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status 
ON work_orders(tenant_id, status, assigned_to);

-- Add missing essential tables if they don't exist

-- Hotel settings for tenant configuration
CREATE TABLE IF NOT EXISTS hotel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  check_in_time TIME DEFAULT '14:00:00',
  check_out_time TIME DEFAULT '12:00:00',
  default_currency TEXT DEFAULT 'NGN',
  timezone TEXT DEFAULT 'Africa/Lagos',
  tax_rate NUMERIC DEFAULT 7.5,
  service_charge_rate NUMERIC DEFAULT 10.0,
  late_checkout_fee NUMERIC DEFAULT 0,
  early_checkin_fee NUMERIC DEFAULT 0,
  cancellation_policy JSONB DEFAULT '{}',
  house_rules JSONB DEFAULT '{}',
  amenities JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on hotel_settings
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for hotel_settings
CREATE POLICY "Hotel settings accessible by tenant" ON hotel_settings
FOR ALL USING (can_access_tenant(tenant_id));

-- Branding assets for logos, receipts, etc.
CREATE TABLE IF NOT EXISTS branding_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  asset_type TEXT NOT NULL, -- 'logo', 'receipt_header', 'letterhead', 'favicon'
  asset_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on branding_assets
ALTER TABLE branding_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for branding_assets
CREATE POLICY "Branding assets accessible by tenant" ON branding_assets
FOR ALL USING (can_access_tenant(tenant_id));

-- Documents table for templates and storage references
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'receipt_template', 'invoice_template', 'policy', 'form'
  name TEXT NOT NULL,
  content JSONB, -- For templates with variable placeholders
  file_url TEXT, -- For uploaded files
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for documents
CREATE POLICY "Documents accessible by tenant" ON documents
FOR ALL USING (can_access_tenant(tenant_id));

-- Currency settings for financial configurations
CREATE TABLE IF NOT EXISTS currency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'NGN',
  supported_currencies JSONB DEFAULT '["NGN", "USD", "EUR", "GBP"]',
  exchange_rates JSONB DEFAULT '{}',
  decimal_places INTEGER DEFAULT 2,
  currency_symbol TEXT DEFAULT '₦',
  currency_position TEXT DEFAULT 'before', -- 'before' or 'after'
  thousands_separator TEXT DEFAULT ',',
  decimal_separator TEXT DEFAULT '.',
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on currency_settings
ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for currency_settings
CREATE POLICY "Currency settings accessible by tenant" ON currency_settings
FOR ALL USING (can_access_tenant(tenant_id));

-- Financial transactions for comprehensive financial tracking
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'income', 'expense', 'transfer'
  category TEXT NOT NULL, -- 'room_revenue', 'f&b_revenue', 'utilities', 'maintenance', etc.
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  description TEXT,
  reference_id UUID, -- Links to reservations, payments, etc.
  reference_type TEXT, -- 'reservation', 'payment', 'expense', etc.
  account_code TEXT, -- For accounting integration
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' -- 'pending', 'completed', 'cancelled'
);

-- Enable RLS on financial_transactions
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for financial_transactions
CREATE POLICY "Financial transactions accessible by tenant" ON financial_transactions
FOR ALL USING (can_access_tenant(tenant_id));

-- Debt tracking for guest outstanding balances
CREATE TABLE IF NOT EXISTS debt_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  folio_id UUID,
  amount_owed NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  due_date DATE,
  overdue_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'outstanding', -- 'outstanding', 'paid', 'written_off'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on debt_tracking
ALTER TABLE debt_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for debt_tracking
CREATE POLICY "Debt tracking accessible by tenant" ON debt_tracking
FOR ALL USING (can_access_tenant(tenant_id));

-- Power logs for utilities tracking
CREATE TABLE IF NOT EXISTS power_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  reading_date DATE NOT NULL,
  meter_reading NUMERIC NOT NULL,
  consumption_kwh NUMERIC,
  cost_per_kwh NUMERIC,
  total_cost NUMERIC,
  meter_id TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on power_logs
ALTER TABLE power_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for power_logs
CREATE POLICY "Power logs accessible by tenant" ON power_logs
FOR ALL USING (can_access_tenant(tenant_id));

-- Fuel logs for generator/vehicle tracking
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  log_date DATE NOT NULL,
  fuel_type TEXT NOT NULL, -- 'diesel', 'petrol', 'gas'
  quantity_liters NUMERIC NOT NULL,
  cost_per_liter NUMERIC,
  total_cost NUMERIC,
  equipment_id TEXT, -- Generator ID, vehicle ID, etc.
  purpose TEXT, -- 'generator', 'vehicle', 'equipment'
  odometer_reading NUMERIC, -- For vehicles
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on fuel_logs
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for fuel_logs
CREATE POLICY "Fuel logs accessible by tenant" ON fuel_logs
FOR ALL USING (can_access_tenant(tenant_id));

-- Utility costs aggregation table
CREATE TABLE IF NOT EXISTS utility_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  cost_month DATE NOT NULL, -- First day of the month
  electricity_cost NUMERIC DEFAULT 0,
  fuel_cost NUMERIC DEFAULT 0,
  water_cost NUMERIC DEFAULT 0,
  gas_cost NUMERIC DEFAULT 0,
  other_utilities JSONB DEFAULT '{}',
  total_cost NUMERIC DEFAULT 0,
  budget_amount NUMERIC,
  variance NUMERIC, -- Actual vs Budget
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on utility_costs
ALTER TABLE utility_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for utility_costs
CREATE POLICY "Utility costs accessible by tenant" ON utility_costs
FOR ALL USING (can_access_tenant(tenant_id));

-- Add indexes for new tables
CREATE INDEX idx_hotel_settings_tenant ON hotel_settings(tenant_id);
CREATE INDEX idx_branding_assets_tenant_type ON branding_assets(tenant_id, asset_type);
CREATE INDEX idx_documents_tenant_type ON documents(tenant_id, document_type);
CREATE INDEX idx_currency_settings_tenant ON currency_settings(tenant_id);
CREATE INDEX idx_financial_transactions_tenant_date ON financial_transactions(tenant_id, created_at);
CREATE INDEX idx_debt_tracking_tenant_status ON debt_tracking(tenant_id, status);
CREATE INDEX idx_power_logs_tenant_date ON power_logs(tenant_id, reading_date);
CREATE INDEX idx_fuel_logs_tenant_date ON fuel_logs(tenant_id, log_date);
CREATE INDEX idx_utility_costs_tenant_month ON utility_costs(tenant_id, cost_month);