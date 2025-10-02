-- Drop all versions of cancel_reservation_atomic
DROP FUNCTION IF EXISTS cancel_reservation_atomic(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS cancel_reservation_atomic(uuid, uuid, text, numeric, text);
DROP FUNCTION IF EXISTS cancel_reservation_atomic(uuid, uuid, uuid, text, numeric, text);

-- Recreate with correct column name
CREATE OR REPLACE FUNCTION cancel_reservation_atomic(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_cancelled_by uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_refund_amount numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id uuid;
  v_folio_id uuid;
  v_reservation_status text;
BEGIN
  -- Get reservation details
  SELECT r.room_id, r.status, f.id
  INTO v_room_id, v_reservation_status, v_folio_id
  FROM reservations r
  LEFT JOIN folios f ON f.reservation_id = r.id AND f.status = 'open'
  WHERE r.id = p_reservation_id 
    AND r.tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found',
      'reservation_id', NULL
    );
  END IF;

  -- Check if already cancelled
  IF v_reservation_status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation is already cancelled',
      'reservation_id', p_reservation_id
    );
  END IF;

  -- Update reservation
  UPDATE reservations
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason,
    refund_amount = p_refund_amount,
    cancellation_notes = p_notes,
    updated_at = now()
  WHERE id = p_reservation_id;

  -- Close folio if exists
  IF v_folio_id IS NOT NULL THEN
    UPDATE folios
    SET 
      status = 'closed',
      closed_at = now(),
      closed_by = p_cancelled_by,
      updated_at = now()
    WHERE id = v_folio_id;
  END IF;

  -- FIX: Use reservation_id (not current_reservation_id)
  UPDATE rooms
  SET 
    status = 'available',
    reservation_id = NULL,
    updated_at = now()
  WHERE id = v_room_id 
    AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reservation cancelled successfully',
    'reservation_id', p_reservation_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_reservation_atomic TO authenticated;