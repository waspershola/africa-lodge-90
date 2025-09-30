-- Phase 3: Centralized Folio Balance Function

-- Create function to get accurate folio balance with all calculations
CREATE OR REPLACE FUNCTION public.get_folio_balance(
  p_folio_id uuid,
  p_tenant_id uuid
) RETURNS TABLE(
  folio_id uuid,
  folio_number text,
  room_number text,
  guest_name text,
  total_charges numeric,
  tax_amount numeric,
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
    COALESCE(f.tax_amount, 0) as tax_amount,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_folio_balance(uuid, uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_folio_balance IS 
  'Returns accurate folio balance with all charges, taxes, and payments calculated. Use this as the single source of truth for folio balances.';