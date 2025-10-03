-- Step 1: Fix get_folio_balance function to use component-based tax calculations
-- Drop and recreate get_folio_balance function without tax_amount

DROP FUNCTION IF EXISTS public.get_folio_balance(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_folio_balance(
  p_folio_id uuid,
  p_tenant_id uuid
) RETURNS TABLE(
  folio_id uuid,
  folio_number text,
  room_number text,
  guest_name text,
  total_charges numeric,
  vat_amount numeric,
  service_charge_amount numeric,
  total_payments numeric,
  balance numeric,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as folio_id,
    f.folio_number,
    r.room_number,
    res.guest_name,
    COALESCE(f.total_charges, 0) as total_charges,
    -- Calculate VAT from folio_charges (component-based)
    COALESCE((
      SELECT ROUND(SUM(vat_amount)::numeric, 2)
      FROM folio_charges 
      WHERE folio_id = f.id
    ), 0) as vat_amount,
    -- Calculate Service Charge from folio_charges (component-based)
    COALESCE((
      SELECT ROUND(SUM(service_charge_amount)::numeric, 2)
      FROM folio_charges 
      WHERE folio_id = f.id
    ), 0) as service_charge_amount,
    COALESCE(f.total_payments, 0) as total_payments,
    COALESCE(f.balance, 0) as balance,
    f.status
  FROM folios f
  JOIN reservations res ON res.id = f.reservation_id
  JOIN rooms r ON r.id = res.room_id
  WHERE f.id = p_folio_id 
    AND f.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO 'public';

GRANT EXECUTE ON FUNCTION get_folio_balance(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION get_folio_balance IS 
  'Returns accurate folio balance with component-based tax breakdown (VAT + Service Charge). Single source of truth for folio balances.';

-- Add audit log entry
INSERT INTO audit_log (
  action, 
  resource_type, 
  description, 
  metadata
) VALUES (
  'SCHEMA_MIGRATION',
  'DATABASE_FUNCTION',
  'Fixed get_folio_balance to use component-based tax calculations',
  jsonb_build_object(
    'function', 'get_folio_balance',
    'change', 'Replaced tax_amount with vat_amount and service_charge_amount',
    'reason', 'Align with folios table schema after dropping tax_amount column',
    'migration_date', NOW()
  )
);