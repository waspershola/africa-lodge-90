-- Fix Double-Taxed Folio Charges
-- This migration corrects existing charges that were stored with incorrect tax calculations

CREATE OR REPLACE FUNCTION fix_double_taxed_charges(p_tenant_id UUID)
RETURNS TABLE(
  fixed_count INTEGER,
  charges_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_charge RECORD;
  v_fixed_count INTEGER := 0;
  v_details JSONB := '[]'::jsonb;
  v_expected_base NUMERIC;
  v_expected_vat NUMERIC;
  v_expected_service NUMERIC;
  v_expected_total NUMERIC;
  v_multiplier NUMERIC;
BEGIN
  -- Get hotel settings
  SELECT 
    COALESCE(tax_rate, 7.5) as vat_rate,
    COALESCE(service_charge_rate, 10.0) as service_rate,
    COALESCE(tax_inclusive, false) as tax_inclusive,
    COALESCE(service_charge_inclusive, false) as service_inclusive
  INTO v_settings
  FROM hotel_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  -- If no settings found, use defaults
  IF NOT FOUND THEN
    v_settings.vat_rate := 7.5;
    v_settings.service_rate := 10.0;
    v_settings.tax_inclusive := false;
    v_settings.service_inclusive := false;
  END IF;

  -- Process each charge that needs fixing
  FOR v_charge IN
    SELECT 
      fc.id,
      fc.folio_id,
      fc.amount,
      fc.base_amount,
      fc.vat_amount,
      fc.service_charge_amount,
      fc.charge_type,
      fc.description
    FROM folio_charges fc
    WHERE fc.tenant_id = p_tenant_id
      AND fc.charge_type = 'room'
      AND (
        -- Missing breakdown fields
        fc.base_amount IS NULL 
        OR fc.vat_amount IS NULL 
        OR fc.service_charge_amount IS NULL
        -- OR suspicious amounts (base_amount too high compared to amount)
        OR (fc.base_amount > fc.amount * 0.9)
      )
  LOOP
    -- Calculate what the breakdown SHOULD be
    -- Assuming EXCLUSIVE mode (most common): total = base + service + vat
    -- vat = (base + service) * vat_rate / 100
    -- service = base * service_rate / 100
    -- total = base + (base * service_rate / 100) + ((base + base * service_rate / 100) * vat_rate / 100)
    -- total = base * (1 + service_rate/100) * (1 + vat_rate/100)
    
    v_multiplier := (1 + v_settings.service_rate / 100.0) * (1 + v_settings.vat_rate / 100.0);
    v_expected_base := ROUND((v_charge.amount / v_multiplier)::numeric, 2);
    v_expected_service := ROUND((v_expected_base * v_settings.service_rate / 100.0)::numeric, 2);
    v_expected_vat := ROUND(((v_expected_base + v_expected_service) * v_settings.vat_rate / 100.0)::numeric, 2);
    v_expected_total := v_expected_base + v_expected_service + v_expected_vat;

    -- Update the charge with correct breakdown
    UPDATE folio_charges
    SET 
      base_amount = v_expected_base,
      service_charge_amount = v_expected_service,
      vat_amount = v_expected_vat,
      amount = v_expected_total,
      updated_at = NOW()
    WHERE id = v_charge.id;

    v_fixed_count := v_fixed_count + 1;

    -- Log the fix
    v_details := v_details || jsonb_build_object(
      'charge_id', v_charge.id,
      'folio_id', v_charge.folio_id,
      'old_amount', v_charge.amount,
      'new_amount', v_expected_total,
      'old_base', COALESCE(v_charge.base_amount, 0),
      'new_base', v_expected_base,
      'difference', v_charge.amount - v_expected_total
    );
  END LOOP;

  -- Recalculate affected folio totals
  UPDATE folios f
  SET 
    total_charges = (
      SELECT COALESCE(SUM(fc.amount), 0)
      FROM folio_charges fc
      WHERE fc.folio_id = f.id
    ),
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND EXISTS (
      SELECT 1 FROM folio_charges fc
      WHERE fc.folio_id = f.id
        AND fc.tenant_id = p_tenant_id
    );

  RETURN QUERY SELECT v_fixed_count, v_details;
END;
$$;

COMMENT ON FUNCTION fix_double_taxed_charges IS 
'Corrects folio charges that were stored with incorrect tax calculations (double taxation issue)';

-- Create a view to identify charges that may need fixing
CREATE OR REPLACE VIEW v_suspicious_charges AS
SELECT 
  fc.id,
  fc.tenant_id,
  fc.folio_id,
  fc.charge_type,
  fc.description,
  fc.amount,
  fc.base_amount,
  fc.vat_amount,
  fc.service_charge_amount,
  CASE 
    WHEN fc.base_amount IS NULL THEN 'Missing base_amount'
    WHEN fc.vat_amount IS NULL THEN 'Missing vat_amount'
    WHEN fc.service_charge_amount IS NULL THEN 'Missing service_charge_amount'
    WHEN fc.base_amount > fc.amount * 0.9 THEN 'Suspicious: base > 90% of total'
    ELSE 'OK'
  END as issue,
  f.folio_number,
  r.reservation_number,
  g.first_name || ' ' || g.last_name as guest_name
FROM folio_charges fc
JOIN folios f ON f.id = fc.folio_id
JOIN reservations r ON r.id = f.reservation_id
LEFT JOIN guests g ON g.id = r.guest_id
WHERE fc.charge_type = 'room'
  AND (
    fc.base_amount IS NULL 
    OR fc.vat_amount IS NULL 
    OR fc.service_charge_amount IS NULL
    OR fc.base_amount > fc.amount * 0.9
  );

COMMENT ON VIEW v_suspicious_charges IS 
'Identifies folio charges that may have incorrect tax calculations';