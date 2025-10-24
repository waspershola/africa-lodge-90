-- Fix get_folio_with_breakdown to return NULL instead of raising exception
-- This prevents frontend from hanging when folio doesn't exist

DROP FUNCTION IF EXISTS get_folio_with_breakdown(UUID);

CREATE OR REPLACE FUNCTION get_folio_with_breakdown(p_folio_id UUID)
RETURNS TABLE (
  folio_id UUID,
  folio_number TEXT,
  reservation_id UUID,
  guest_name TEXT,
  room_number TEXT,
  total_charges NUMERIC,
  total_payments NUMERIC,
  balance NUMERIC,
  status TEXT,
  charges JSONB,
  payments JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if folio exists - return NULL instead of throwing error
  IF NOT EXISTS (SELECT 1 FROM folios WHERE id = p_folio_id) THEN
    RETURN; -- Return empty result set (NULL)
  END IF;

  RETURN QUERY
  SELECT 
    f.id as folio_id,
    f.folio_number,
    f.reservation_id,
    r.guest_name,
    rm.room_number,
    f.total_charges,
    f.total_payments,
    f.balance,
    f.status,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', fc.id,
          'charge_type', fc.charge_type,
          'description', fc.description,
          'amount', fc.amount,
          'base_amount', fc.base_amount,
          'vat_amount', fc.vat_amount,
          'service_charge_amount', fc.service_charge_amount,
          'created_at', fc.created_at,
          'posted_by', fc.posted_by
        )
      )
      FROM folio_charges fc
      WHERE fc.folio_id = f.id
      ), '[]'::jsonb
    ) as charges,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'amount', p.amount,
          'payment_method', p.payment_method,
          'status', p.status,
          'created_at', p.created_at,
          'processed_by', p.processed_by
        )
      )
      FROM payments p
      WHERE p.folio_id = f.id
      ), '[]'::jsonb
    ) as payments
  FROM folios f
  LEFT JOIN reservations r ON r.id = f.reservation_id
  LEFT JOIN rooms rm ON rm.id = r.room_id
  WHERE f.id = p_folio_id;
END;
$$;