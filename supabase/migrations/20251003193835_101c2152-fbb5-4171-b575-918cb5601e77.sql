-- PHASE 2: Database Corrections for Billing Integrity

-- 2.1: Create function to recalculate individual folio balance
CREATE OR REPLACE FUNCTION public.recalculate_folio_balance(p_folio_id UUID)
RETURNS TABLE(
  folio_id UUID,
  old_total_charges NUMERIC,
  new_total_charges NUMERIC,
  old_total_payments NUMERIC,
  new_total_payments NUMERIC,
  old_balance NUMERIC,
  new_balance NUMERIC,
  was_corrected BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folio RECORD;
  v_calculated_charges NUMERIC;
  v_calculated_payments NUMERIC;
  v_calculated_balance NUMERIC;
  v_needs_update BOOLEAN := false;
BEGIN
  -- Get current folio state
  SELECT * INTO v_folio
  FROM folios
  WHERE id = p_folio_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Folio not found: %', p_folio_id;
  END IF;
  
  -- Calculate actual charges from folio_charges (use 2 decimal precision)
  SELECT COALESCE(ROUND(SUM(amount)::numeric, 2), 0) INTO v_calculated_charges
  FROM folio_charges
  WHERE folio_id = p_folio_id;
  
  -- Calculate actual payments (use 2 decimal precision)
  SELECT COALESCE(ROUND(SUM(amount)::numeric, 2), 0) INTO v_calculated_payments
  FROM payments
  WHERE folio_id = p_folio_id
    AND status = 'completed';
  
  v_calculated_balance := ROUND((v_calculated_charges - v_calculated_payments)::numeric, 2);
  
  -- Check if update needed (tolerance: ₦0.01)
  IF ABS(v_folio.total_charges - v_calculated_charges) > 0.01 OR
     ABS(v_folio.total_payments - v_calculated_payments) > 0.01 THEN
    v_needs_update := true;
    
    -- Update folio with calculated values
    UPDATE folios
    SET total_charges = v_calculated_charges,
        total_payments = v_calculated_payments,
        updated_at = NOW()
    WHERE id = p_folio_id;
    
    -- Log the correction
    INSERT INTO audit_log (
      action, resource_type, resource_id, tenant_id,
      description, metadata
    ) VALUES (
      'FOLIO_RECALCULATION',
      'FOLIO',
      p_folio_id,
      v_folio.tenant_id,
      'Automatic folio balance recalculation',
      jsonb_build_object(
        'old_charges', v_folio.total_charges,
        'new_charges', v_calculated_charges,
        'old_payments', v_folio.total_payments,
        'new_payments', v_calculated_payments,
        'old_balance', v_folio.balance,
        'new_balance', v_calculated_balance
      )
    );
  END IF;
  
  -- Return comparison data
  RETURN QUERY SELECT
    p_folio_id,
    v_folio.total_charges,
    v_calculated_charges,
    v_folio.total_payments,
    v_calculated_payments,
    v_folio.balance,
    v_calculated_balance,
    v_needs_update;
END;
$$;

-- 2.2: Create function to recalculate all folios for a tenant
CREATE OR REPLACE FUNCTION public.recalculate_all_folios(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE(
  folios_checked INTEGER,
  folios_corrected INTEGER,
  total_charge_diff NUMERIC,
  total_payment_diff NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folio RECORD;
  v_result RECORD;
  v_checked INTEGER := 0;
  v_corrected INTEGER := 0;
  v_charge_diff NUMERIC := 0;
  v_payment_diff NUMERIC := 0;
BEGIN
  FOR v_folio IN
    SELECT id
    FROM folios
    WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      AND status = 'open'
  LOOP
    v_checked := v_checked + 1;
    
    -- Get recalculation result
    SELECT * INTO v_result
    FROM recalculate_folio_balance(v_folio.id);
    
    IF v_result.was_corrected THEN
      v_corrected := v_corrected + 1;
      v_charge_diff := v_charge_diff + ABS(v_result.old_total_charges - v_result.new_total_charges);
      v_payment_diff := v_payment_diff + ABS(v_result.old_total_payments - v_result.new_total_payments);
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_checked, v_corrected, v_charge_diff, v_payment_diff;
END;
$$;

-- 2.3: Create/update function for standardized tax calculation
CREATE OR REPLACE FUNCTION public.calculate_charges_with_tax(
  p_base_amount NUMERIC,
  p_charge_type TEXT,
  p_tenant_id UUID
)
RETURNS TABLE(
  base_amount NUMERIC,
  service_charge_amount NUMERIC,
  vat_amount NUMERIC,
  total_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_rate NUMERIC;
  v_vat_rate NUMERIC;
  v_service_amount NUMERIC;
  v_taxable_amount NUMERIC;
  v_vat_amount NUMERIC;
  v_total NUMERIC;
  v_service_applicable BOOLEAN := false;
  v_vat_applicable BOOLEAN := false;
BEGIN
  -- Get rates and applicability from hotel_settings
  SELECT 
    service_charge_rate,
    tax_rate,
    p_charge_type = ANY(service_applicable_to),
    p_charge_type = ANY(vat_applicable_to)
  INTO v_service_rate, v_vat_rate, v_service_applicable, v_vat_applicable
  FROM hotel_settings
  WHERE tenant_id = p_tenant_id;
  
  -- Default rates if not found
  v_service_rate := COALESCE(v_service_rate, 10.0);
  v_vat_rate := COALESCE(v_vat_rate, 7.5);
  
  -- Calculate service charge on base (with 2 decimal rounding)
  IF v_service_applicable THEN
    v_service_amount := ROUND((p_base_amount * v_service_rate / 100)::numeric, 2);
  ELSE
    v_service_amount := 0;
  END IF;
  
  -- CRITICAL FIX: VAT applies to (base + service), not just base
  v_taxable_amount := p_base_amount + v_service_amount;
  
  IF v_vat_applicable THEN
    v_vat_amount := ROUND((v_taxable_amount * v_vat_rate / 100)::numeric, 2);
  ELSE
    v_vat_amount := 0;
  END IF;
  
  -- Total with 2 decimal precision
  v_total := ROUND((p_base_amount + v_service_amount + v_vat_amount)::numeric, 2);
  
  RETURN QUERY SELECT
    ROUND(p_base_amount::numeric, 2),
    v_service_amount,
    v_vat_amount,
    v_total;
END;
$$;

-- 2.4: Add comment documentation
COMMENT ON FUNCTION public.recalculate_folio_balance IS 
'Recalculates folio totals from actual charges and payments. Returns comparison data and auto-corrects discrepancies.';

COMMENT ON FUNCTION public.recalculate_all_folios IS 
'Recalculates all open folios for a tenant. Returns summary of corrections made.';

COMMENT ON FUNCTION public.calculate_charges_with_tax IS 
'Calculates charges with proper tax breakdown. Service charge applied to base, VAT applied to (base + service).';
