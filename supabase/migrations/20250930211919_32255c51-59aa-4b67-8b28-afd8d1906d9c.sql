-- Phase 1: Add tax columns to folios table
ALTER TABLE folios 
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 7.5,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;

-- Phase 2: Drop the generated column constraint on balance
ALTER TABLE folios ALTER COLUMN balance DROP EXPRESSION IF EXISTS;
ALTER TABLE folios ALTER COLUMN balance SET DEFAULT 0;

-- Phase 3: Create auto-balance calculation trigger function
CREATE OR REPLACE FUNCTION calculate_folio_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_folio_id UUID;
  v_total_charges NUMERIC;
  v_total_payments NUMERIC;
  v_tax_rate NUMERIC;
  v_tax_amount NUMERIC;
  v_balance NUMERIC;
BEGIN
  -- Get the folio_id from the operation
  v_folio_id := COALESCE(NEW.folio_id, OLD.folio_id);
  
  -- Get tax rate for this folio
  SELECT tax_rate INTO v_tax_rate FROM folios WHERE id = v_folio_id;
  v_tax_rate := COALESCE(v_tax_rate, 7.5);
  
  -- Calculate total charges
  SELECT COALESCE(SUM(amount), 0) INTO v_total_charges
  FROM folio_charges 
  WHERE folio_id = v_folio_id;
  
  -- Calculate total payments
  SELECT COALESCE(SUM(amount), 0) INTO v_total_payments
  FROM payments 
  WHERE folio_id = v_folio_id 
  AND status = 'completed';
  
  -- Calculate tax amount
  v_tax_amount := v_total_charges * v_tax_rate / 100;
  
  -- Calculate balance (charges + tax - payments)
  v_balance := v_total_charges + v_tax_amount - v_total_payments;
  
  -- Update the folio
  UPDATE folios 
  SET 
    total_charges = v_total_charges,
    total_payments = v_total_payments,
    tax_amount = v_tax_amount,
    balance = v_balance,
    updated_at = now()
  WHERE id = v_folio_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phase 4: Create triggers on folio_charges
DROP TRIGGER IF EXISTS trigger_update_folio_balance_on_charges ON folio_charges;
CREATE TRIGGER trigger_update_folio_balance_on_charges
  AFTER INSERT OR UPDATE OR DELETE ON folio_charges
  FOR EACH ROW EXECUTE FUNCTION calculate_folio_balance();

-- Phase 5: Create triggers on payments
DROP TRIGGER IF EXISTS trigger_update_folio_balance_on_payments ON payments;
CREATE TRIGGER trigger_update_folio_balance_on_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION calculate_folio_balance();

-- Phase 6: Backfill existing data
UPDATE folios 
SET 
  tax_amount = COALESCE((total_charges * COALESCE(tax_rate, 7.5) / 100), 0),
  balance = COALESCE((total_charges + (total_charges * COALESCE(tax_rate, 7.5) / 100) - total_payments), 0),
  updated_at = now();

-- Phase 7: Enable realtime on folios table
ALTER PUBLICATION supabase_realtime ADD TABLE folios;