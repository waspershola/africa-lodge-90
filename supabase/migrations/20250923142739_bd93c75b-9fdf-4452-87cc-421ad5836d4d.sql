-- Add staff financial and audit tables for salary management

-- Staff financials table for salary/wage management
CREATE TABLE staff_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  salary_amount NUMERIC(10,2),
  salary_currency TEXT DEFAULT 'NGN',
  payment_method TEXT DEFAULT 'bank_transfer',
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  salary_grade TEXT,
  employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, contract, hourly
  hourly_rate NUMERIC(8,2), -- for hourly workers
  monthly_salary NUMERIC(10,2), -- for monthly salary
  annual_salary NUMERIC(10,2), -- for annual contracts
  status TEXT DEFAULT 'active', -- active, suspended, terminated
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT valid_employment_type CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'hourly')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('bank_transfer', 'cash', 'mobile_money', 'check')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'terminated'))
);

-- Staff salary audit trail
CREATE TABLE staff_salary_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  old_salary NUMERIC(10,2),
  new_salary NUMERIC(10,2),
  change_reason TEXT,
  effective_date DATE DEFAULT CURRENT_DATE,
  approval_stage TEXT DEFAULT 'pending', -- pending, manager_approved, owner_approved, completed, rejected
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT valid_approval_stage CHECK (approval_stage IN ('pending', 'manager_approved', 'owner_approved', 'completed', 'rejected'))
);

-- Salary payments tracking
CREATE TABLE salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  payment_period_start DATE NOT NULL,
  payment_period_end DATE NOT NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  deductions NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  payment_date DATE,
  payment_reference TEXT,
  payment_method TEXT DEFAULT 'bank_transfer',
  status TEXT DEFAULT 'pending', -- pending, approved, paid, failed, cancelled
  approved_by UUID REFERENCES users(id),
  paid_by UUID REFERENCES users(id),
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'approved', 'paid', 'failed', 'cancelled')),
  CONSTRAINT valid_payment_period CHECK (payment_period_end >= payment_period_start),
  CONSTRAINT valid_amounts CHECK (gross_amount >= 0 AND deductions >= 0 AND net_amount >= 0)
);

-- Add indexes for performance
CREATE INDEX idx_staff_financials_tenant ON staff_financials(tenant_id);
CREATE INDEX idx_staff_financials_user ON staff_financials(user_id);
CREATE INDEX idx_staff_salary_audit_tenant ON staff_salary_audit(tenant_id);
CREATE INDEX idx_staff_salary_audit_user ON staff_salary_audit(user_id);
CREATE INDEX idx_salary_payments_tenant ON salary_payments(tenant_id);
CREATE INDEX idx_salary_payments_user ON salary_payments(user_id);
CREATE INDEX idx_salary_payments_status ON salary_payments(status);
CREATE INDEX idx_salary_payments_period ON salary_payments(payment_period_start, payment_period_end);

-- Enable RLS
ALTER TABLE staff_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_salary_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_financials
CREATE POLICY "Staff financials accessible by tenant" ON staff_financials
  FOR ALL USING (can_access_tenant(tenant_id));

-- RLS Policies for staff_salary_audit
CREATE POLICY "Salary audit accessible by tenant managers" ON staff_salary_audit
  FOR SELECT USING (
    can_access_tenant(tenant_id) AND 
    get_user_role() IN ('OWNER', 'MANAGER', 'ACCOUNTANT')
  );

CREATE POLICY "Managers can create salary audits" ON staff_salary_audit
  FOR INSERT WITH CHECK (
    can_access_tenant(tenant_id) AND 
    get_user_role() IN ('OWNER', 'MANAGER')
  );

CREATE POLICY "Managers can update salary audits" ON staff_salary_audit
  FOR UPDATE USING (
    can_access_tenant(tenant_id) AND 
    get_user_role() IN ('OWNER', 'MANAGER', 'ACCOUNTANT')
  );

-- RLS Policies for salary_payments
CREATE POLICY "Salary payments accessible by financial staff" ON salary_payments
  FOR SELECT USING (
    can_access_tenant(tenant_id) AND 
    get_user_role() IN ('OWNER', 'MANAGER', 'ACCOUNTANT')
  );

CREATE POLICY "Financial staff can manage salary payments" ON salary_payments
  FOR ALL USING (
    can_access_tenant(tenant_id) AND 
    get_user_role() IN ('OWNER', 'MANAGER', 'ACCOUNTANT')
  );

-- Add trigger to update staff_financials updated_at
CREATE OR REPLACE FUNCTION update_staff_financials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_financials_updated_at
  BEFORE UPDATE ON staff_financials
  FOR EACH ROW EXECUTE FUNCTION update_staff_financials_updated_at();

CREATE TRIGGER update_salary_payments_updated_at
  BEFORE UPDATE ON salary_payments
  FOR EACH ROW EXECUTE FUNCTION update_staff_financials_updated_at();