-- ===================================================================
-- PHASE 1: DATABASE SCHEMA FIXES + PHASE 7: IMMEDIATE DATA FIXES
-- Comprehensive Billing System Overhaul
-- ===================================================================

-- PHASE 7.1: Fix all stale balances in existing folios (IMMEDIATE FIX)
UPDATE folios 
SET balance = (total_charges - total_payments),
    updated_at = NOW()
WHERE status = 'open' 
  AND ABS(balance - (total_charges - total_payments)) > 0.01;

-- PHASE 1.1: Convert balance to GENERATED ALWAYS column (CRITICAL)

-- Step 1: Drop the dependent materialized view
DROP MATERIALIZED VIEW IF EXISTS folio_balances CASCADE;

-- Step 2: Drop the old balance column
ALTER TABLE folios DROP COLUMN IF EXISTS balance;

-- Step 3: Add balance as a GENERATED ALWAYS column
ALTER TABLE folios ADD COLUMN balance NUMERIC(12,2) 
  GENERATED ALWAYS AS (total_charges - total_payments) STORED;

COMMENT ON COLUMN folios.balance IS 'Auto-computed: total_charges - total_payments. Always accurate, cannot be manually set.';

-- Step 4: Recreate the materialized view with generated balance
CREATE MATERIALIZED VIEW folio_balances AS
SELECT 
  f.id as folio_id,
  f.tenant_id,
  f.reservation_id,
  f.folio_number,
  f.total_charges,
  f.total_payments,
  f.balance,
  f.status,
  r.room_id,
  r.guest_name,
  r.check_in_date,
  r.check_out_date
FROM folios f
LEFT JOIN reservations r ON r.id = f.reservation_id
WHERE f.status = 'open';

CREATE UNIQUE INDEX idx_folio_balances_id ON folio_balances(folio_id);
CREATE INDEX idx_folio_balances_tenant ON folio_balances(tenant_id);
CREATE INDEX idx_folio_balances_room ON folio_balances(room_id);

-- PHASE 1.2: Add validation constraints
ALTER TABLE folios ADD CONSTRAINT check_totals_non_negative 
  CHECK (total_charges >= 0 AND total_payments >= 0);

ALTER TABLE folios ADD CONSTRAINT check_balance_validity 
  CHECK (balance >= -0.01 OR (balance < 0 AND total_payments > total_charges));

-- PHASE 1.3: Create immutable billing ledger table
CREATE TABLE IF NOT EXISTS billing_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  folio_id UUID NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'charge', 'payment', 'reversal', 'adjustment', 'refund', 'fee'
  )),
  amount NUMERIC(12,2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_billing_ledger_tenant ON billing_ledger(tenant_id);
CREATE INDEX idx_billing_ledger_folio ON billing_ledger(folio_id);
CREATE INDEX idx_billing_ledger_created ON billing_ledger(created_at DESC);
CREATE INDEX idx_billing_ledger_type ON billing_ledger(transaction_type);

ALTER TABLE billing_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant staff can view billing ledger"
  ON billing_ledger FOR SELECT
  USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can insert billing ledger entries"
  ON billing_ledger FOR INSERT
  WITH CHECK (
    can_access_tenant(tenant_id) AND
    (get_user_role() = ANY (ARRAY['OWNER', 'MANAGER', 'FRONT_DESK', 'POS']))
  );

CREATE POLICY "Block ledger updates" ON billing_ledger FOR UPDATE USING (false);
CREATE POLICY "Block ledger deletes" ON billing_ledger FOR DELETE USING (false);

COMMENT ON TABLE billing_ledger IS 'Immutable financial transaction ledger. INSERT only - no updates or deletes allowed.';

-- PHASE 1.4: Auto-populate ledger from charges
CREATE OR REPLACE FUNCTION create_ledger_entry_from_charge()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO billing_ledger (
      tenant_id, folio_id, transaction_type, amount,
      reference_type, reference_id, description, user_id, metadata
    ) VALUES (
      NEW.tenant_id, NEW.folio_id, 'charge', NEW.amount,
      'folio_charge', NEW.id, NEW.description, NEW.posted_by,
      jsonb_build_object(
        'charge_type', NEW.charge_type,
        'base_amount', NEW.base_amount,
        'service_charge_amount', NEW.service_charge_amount,
        'vat_amount', NEW.vat_amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_ledger_from_charge
  AFTER INSERT ON folio_charges
  FOR EACH ROW EXECUTE FUNCTION create_ledger_entry_from_charge();

-- PHASE 1.5: Auto-populate ledger from payments
CREATE OR REPLACE FUNCTION create_ledger_entry_from_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') THEN
    INSERT INTO billing_ledger (
      tenant_id, folio_id, transaction_type, amount,
      reference_type, reference_id, description, user_id, metadata
    ) VALUES (
      NEW.tenant_id, NEW.folio_id, 'payment', NEW.amount,
      'payment', NEW.id,
      COALESCE('Payment via ' || NEW.payment_method, 'Payment received'),
      NEW.processed_by,
      jsonb_build_object('payment_method', NEW.payment_method, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_ledger_from_payment
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION create_ledger_entry_from_payment();

-- Audit log
INSERT INTO audit_log (action, resource_type, description, metadata)
VALUES (
  'BILLING_SYSTEM_OVERHAUL', 'SYSTEM',
  'Implemented comprehensive billing fix',
  jsonb_build_object(
    'changes', ARRAY[
      'Generated balance column',
      'Validation constraints',
      'Immutable ledger',
      'Auto-ledger triggers',
      'Fixed stale balances'
    ]
  )
);