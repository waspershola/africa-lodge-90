-- PHASE 3: Create RPC function for unified folio data retrieval

CREATE OR REPLACE FUNCTION public.get_folio_with_breakdown(p_folio_id UUID)
RETURNS TABLE(
  folio_id UUID,
  folio_number TEXT,
  reservation_id UUID,
  total_charges NUMERIC,
  total_payments NUMERIC,
  balance NUMERIC,
  payment_status TEXT,
  credit_amount NUMERIC,
  charges JSONB,
  payments JSONB,
  tax_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folio RECORD;
  v_charges JSONB;
  v_payments JSONB;
  v_tax_breakdown JSONB;
  v_balance NUMERIC;
  v_payment_status TEXT;
  v_credit_amount NUMERIC := 0;
BEGIN
  -- Get folio
  SELECT * INTO v_folio
  FROM folios
  WHERE id = p_folio_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Folio not found: %', p_folio_id;
  END IF;
  
  -- Calculate balance with 2 decimal precision
  v_balance := ROUND((v_folio.total_charges - v_folio.total_payments)::numeric, 2);
  
  -- Determine payment status with proper overpaid handling
  IF ABS(v_balance) < 0.01 THEN
    v_payment_status := 'paid';
    v_credit_amount := 0;
  ELSIF v_balance < 0 THEN
    v_payment_status := 'overpaid';
    v_credit_amount := ABS(v_balance);
  ELSIF v_folio.total_payments > 0 THEN
    v_payment_status := 'partial';
    v_credit_amount := 0;
  ELSE
    v_payment_status := 'unpaid';
    v_credit_amount := 0;
  END IF;
  
  -- Get charge breakdown
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', fc.id,
      'charge_type', fc.charge_type,
      'description', fc.description,
      'base_amount', ROUND(COALESCE(fc.base_amount, fc.amount)::numeric, 2),
      'service_charge_amount', ROUND(COALESCE(fc.service_charge_amount, 0)::numeric, 2),
      'vat_amount', ROUND(COALESCE(fc.vat_amount, 0)::numeric, 2),
      'amount', ROUND(fc.amount::numeric, 2),
      'created_at', fc.created_at
    )
  ), '[]'::jsonb)
  INTO v_charges
  FROM folio_charges fc
  WHERE fc.folio_id = p_folio_id;
  
  -- Get payment breakdown
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'amount', ROUND(p.amount::numeric, 2),
      'payment_method', p.payment_method,
      'status', p.status,
      'created_at', p.created_at,
      'processed_by', p.processed_by
    )
  ), '[]'::jsonb)
  INTO v_payments
  FROM payments p
  WHERE p.folio_id = p_folio_id
    AND p.status = 'completed';
  
  -- Calculate tax breakdown from charges
  SELECT jsonb_build_object(
    'subtotal', ROUND(COALESCE(SUM(COALESCE(fc.base_amount, fc.amount)), 0)::numeric, 2),
    'service_charge', ROUND(COALESCE(SUM(fc.service_charge_amount), 0)::numeric, 2),
    'vat', ROUND(COALESCE(SUM(fc.vat_amount), 0)::numeric, 2),
    'total', ROUND(v_folio.total_charges::numeric, 2)
  )
  INTO v_tax_breakdown
  FROM folio_charges fc
  WHERE fc.folio_id = p_folio_id;
  
  -- Return unified data
  RETURN QUERY SELECT
    p_folio_id,
    v_folio.folio_number,
    v_folio.reservation_id,
    ROUND(v_folio.total_charges::numeric, 2),
    ROUND(v_folio.total_payments::numeric, 2),
    v_balance,
    v_payment_status,
    v_credit_amount,
    v_charges,
    v_payments,
    v_tax_breakdown;
END;
$$;

COMMENT ON FUNCTION public.get_folio_with_breakdown IS 
'Unified folio data retrieval with full breakdown. Single source of truth for all billing displays.';
