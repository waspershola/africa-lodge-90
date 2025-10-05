-- Phase 2: Payment Schema Upgrade for Department/Terminal Tracking
-- Create departments, terminals, and extend payments table
-- FIXED: Use tenant_id instead of id for tenants table reference

-- ==========================================
-- 1. DEPARTMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  revenue_account text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Indexes for departments
CREATE INDEX idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX idx_departments_code ON public.departments(tenant_id, code) WHERE is_active = true;

-- RLS for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments accessible by tenant"
  ON public.departments
  FOR ALL
  USING (can_access_tenant(tenant_id));

-- Seed default departments for existing tenants
INSERT INTO public.departments (tenant_id, name, code, description)
SELECT 
  tenant_id,
  'Front Desk' as name,
  'FRONTDESK' as code,
  'Front desk operations and room bookings' as description
FROM public.tenants
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.tenant_id = tenants.tenant_id AND d.code = 'FRONTDESK'
);

INSERT INTO public.departments (tenant_id, name, code, description)
SELECT 
  tenant_id,
  'Restaurant' as name,
  'RESTAURANT' as code,
  'Restaurant food and beverage service' as description
FROM public.tenants
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.tenant_id = tenants.tenant_id AND d.code = 'RESTAURANT'
);

INSERT INTO public.departments (tenant_id, name, code, description)
SELECT 
  tenant_id,
  'Bar' as name,
  'BAR' as code,
  'Bar service and beverages' as description
FROM public.tenants
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.tenant_id = tenants.tenant_id AND d.code = 'BAR'
);

INSERT INTO public.departments (tenant_id, name, code, description)
SELECT 
  tenant_id,
  'Gym' as name,
  'GYM' as code,
  'Fitness center and gym services' as description
FROM public.tenants
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.tenant_id = tenants.tenant_id AND d.code = 'GYM'
);

INSERT INTO public.departments (tenant_id, name, code, description)
SELECT 
  tenant_id,
  'Spa' as name,
  'SPA' as code,
  'Spa and wellness services' as description
FROM public.tenants
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.tenant_id = tenants.tenant_id AND d.code = 'SPA'
);

INSERT INTO public.departments (tenant_id, name, code, description)
SELECT 
  tenant_id,
  'Laundry' as name,
  'LAUNDRY' as code,
  'Laundry and housekeeping services' as description
FROM public.tenants
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.tenant_id = tenants.tenant_id AND d.code = 'LAUNDRY'
);

-- ==========================================
-- 2. TERMINALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  terminal_code text NOT NULL,
  terminal_name text NOT NULL,
  location text,
  terminal_type text DEFAULT 'pos',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, terminal_code)
);

-- Indexes for terminals
CREATE INDEX idx_terminals_tenant_id ON public.terminals(tenant_id);
CREATE INDEX idx_terminals_department_id ON public.terminals(department_id);
CREATE INDEX idx_terminals_code ON public.terminals(tenant_id, terminal_code) WHERE is_active = true;

-- RLS for terminals
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Terminals accessible by tenant"
  ON public.terminals
  FOR ALL
  USING (can_access_tenant(tenant_id));

-- Seed default terminals for existing tenants
INSERT INTO public.terminals (tenant_id, department_id, terminal_code, terminal_name, location, terminal_type)
SELECT 
  t.tenant_id,
  d.id as department_id,
  'POS-FD-01' as terminal_code,
  'Front Desk POS #1' as terminal_name,
  'Front Desk' as location,
  'pos' as terminal_type
FROM public.tenants t
JOIN public.departments d ON d.tenant_id = t.tenant_id AND d.code = 'FRONTDESK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.terminals tm 
  WHERE tm.tenant_id = t.tenant_id AND tm.terminal_code = 'POS-FD-01'
);

-- ==========================================
-- 3. EXTEND PAYMENTS TABLE
-- ==========================================

-- Add new columns to payments table
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS terminal_id uuid REFERENCES public.terminals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS payment_source text DEFAULT 'frontdesk',
  ADD COLUMN IF NOT EXISTS gross_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS fee_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount numeric(10,2);

-- Add check constraint for payment_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_payment_status_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_payment_status_check 
      CHECK (payment_status IN ('paid', 'unpaid', 'pending'));
  END IF;
END $$;

-- Add check constraint for payment_source
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_payment_source_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_payment_source_check 
      CHECK (payment_source IN ('frontdesk', 'restaurant', 'bar', 'gym', 'spa', 'laundry', 'other'));
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payments_department_id ON public.payments(department_id);
CREATE INDEX IF NOT EXISTS idx_payments_terminal_id ON public.payments(terminal_id);
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON public.payments(verified_by);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_source ON public.payments(payment_source);

-- Backfill existing payments with default values
UPDATE public.payments 
SET 
  payment_status = 'paid',
  is_verified = true,
  payment_source = 'frontdesk',
  gross_amount = amount,
  fee_amount = 0,
  net_amount = amount,
  verified_at = created_at,
  verified_by = processed_by
WHERE payment_status IS NULL;

-- ==========================================
-- 4. HELPER FUNCTIONS
-- ==========================================

-- Function to get default department for a tenant
CREATE OR REPLACE FUNCTION public.get_default_department(p_tenant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_department_id uuid;
BEGIN
  SELECT id INTO v_department_id
  FROM public.departments
  WHERE tenant_id = p_tenant_id 
    AND code = 'FRONTDESK'
    AND is_active = true
  LIMIT 1;
  
  RETURN v_department_id;
END;
$$;

-- Function to get default terminal for a department
CREATE OR REPLACE FUNCTION public.get_default_terminal(p_tenant_id uuid, p_department_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_terminal_id uuid;
BEGIN
  SELECT id INTO v_terminal_id
  FROM public.terminals
  WHERE tenant_id = p_tenant_id 
    AND (p_department_id IS NULL OR department_id = p_department_id)
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  RETURN v_terminal_id;
END;
$$;

-- ==========================================
-- 5. AUDIT TRIGGERS
-- ==========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_departments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_departments_updated_at();

CREATE TRIGGER trigger_update_terminals_updated_at
  BEFORE UPDATE ON public.terminals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_departments_updated_at();

-- Audit log trigger for payment verification
CREATE OR REPLACE FUNCTION public.audit_payment_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified = true AND (OLD.is_verified IS NULL OR OLD.is_verified = false) THEN
    INSERT INTO public.audit_log (
      action,
      resource_type,
      resource_id,
      actor_id,
      tenant_id,
      description,
      metadata
    ) VALUES (
      'PAYMENT_VERIFIED',
      'PAYMENT',
      NEW.id,
      NEW.verified_by,
      NEW.tenant_id,
      'Payment verified',
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount,
        'payment_method_id', NEW.payment_method_id,
        'department_id', NEW.department_id,
        'terminal_id', NEW.terminal_id,
        'payment_status', NEW.payment_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_payment_verification
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_verification();

COMMENT ON TABLE public.departments IS 'Revenue departments/centers for tracking payment sources';
COMMENT ON TABLE public.terminals IS 'POS terminals and payment collection points';
COMMENT ON COLUMN public.payments.department_id IS 'Department where payment originated';
COMMENT ON COLUMN public.payments.terminal_id IS 'Terminal/POS where payment was processed';
COMMENT ON COLUMN public.payments.verified_by IS 'User who verified the payment';
COMMENT ON COLUMN public.payments.verified_at IS 'When payment was verified';
COMMENT ON COLUMN public.payments.is_verified IS 'Whether payment has been verified';
COMMENT ON COLUMN public.payments.payment_status IS 'Status: paid, unpaid, pending';
COMMENT ON COLUMN public.payments.payment_source IS 'Where payment originated: frontdesk, restaurant, bar, gym, spa, laundry, other';
COMMENT ON COLUMN public.payments.gross_amount IS 'Amount before fees';
COMMENT ON COLUMN public.payments.fee_amount IS 'Processing fee amount';
COMMENT ON COLUMN public.payments.net_amount IS 'Amount after fees (what hotel receives)';
