-- Enhanced cancel_reservation_atomic with payment handling
-- Supports blocked states, payment tracking, and refund/credit options

DROP FUNCTION IF EXISTS cancel_reservation_atomic(uuid, uuid, uuid, text, numeric, text);

CREATE OR REPLACE FUNCTION cancel_reservation_atomic(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_cancelled_by uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_refund_amount numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_payment_action text DEFAULT 'none' -- 'refund', 'credit', 'forfeit', 'none'
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
  v_guest_id uuid;
  v_total_paid numeric := 0;
  v_payment_record jsonb;
BEGIN
  -- Get reservation details including guest and payments
  SELECT 
    r.room_id, 
    r.status, 
    r.guest_id,
    f.id,
    COALESCE(
      (SELECT SUM(amount) FROM payments 
       WHERE folio_id = f.id AND status = 'completed'), 
      0
    )
  INTO v_room_id, v_reservation_status, v_guest_id, v_folio_id, v_total_paid
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

  -- Block cancellation for checked-in guests
  IF v_reservation_status = 'checked_in' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Room is occupied. Please process Early Check-out instead.',
      'reservation_id', p_reservation_id,
      'blocked_reason', 'checked_in'
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

  -- Only allow cancellation for 'confirmed' or 'pending' status
  IF v_reservation_status NOT IN ('confirmed', 'pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation status does not allow cancellation',
      'reservation_id', p_reservation_id,
      'current_status', v_reservation_status
    );
  END IF;

  -- Handle payment actions
  IF p_payment_action = 'refund' AND v_total_paid > 0 AND p_refund_amount > 0 THEN
    -- Create refund payment record
    INSERT INTO payments (
      tenant_id,
      folio_id,
      amount,
      payment_method,
      status,
      processed_by,
      reference
    ) VALUES (
      p_tenant_id,
      v_folio_id,
      -p_refund_amount, -- Negative for refund
      'refund',
      'completed',
      p_cancelled_by,
      'Refund for cancellation: ' || p_reservation_id
    );
    
    v_payment_record := jsonb_build_object(
      'action', 'refund',
      'amount', p_refund_amount
    );
    
  ELSIF p_payment_action = 'credit' AND v_total_paid > 0 AND p_refund_amount > 0 THEN
    -- Update guest credit balance (implement if guest credits table exists)
    -- For now, record as credit note in payments
    INSERT INTO payments (
      tenant_id,
      folio_id,
      amount,
      payment_method,
      status,
      processed_by,
      reference
    ) VALUES (
      p_tenant_id,
      v_folio_id,
      -p_refund_amount,
      'credit',
      'completed',
      p_cancelled_by,
      'Credit for cancellation: ' || p_reservation_id
    );
    
    v_payment_record := jsonb_build_object(
      'action', 'credit',
      'amount', p_refund_amount,
      'guest_id', v_guest_id
    );
    
  ELSIF p_payment_action = 'forfeit' THEN
    -- Payment is forfeited (no refund)
    v_payment_record := jsonb_build_object(
      'action', 'forfeit',
      'amount', 0
    );
  ELSE
    v_payment_record := jsonb_build_object('action', 'none');
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

  -- Release room
  UPDATE rooms
  SET 
    status = 'available',
    reservation_id = NULL,
    updated_at = now()
  WHERE id = v_room_id 
    AND tenant_id = p_tenant_id;

  -- Audit log
  INSERT INTO audit_log (
    action,
    resource_type,
    resource_id,
    tenant_id,
    actor_id,
    description,
    metadata
  ) VALUES (
    'CANCEL_RESERVATION',
    'RESERVATION',
    p_reservation_id,
    p_tenant_id,
    p_cancelled_by,
    'Reservation cancelled: ' || COALESCE(p_reason, 'No reason provided'),
    jsonb_build_object(
      'room_id', v_room_id,
      'payment_action', p_payment_action,
      'refund_amount', p_refund_amount,
      'total_paid', v_total_paid,
      'payment_record', v_payment_record
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reservation cancelled successfully',
    'reservation_id', p_reservation_id,
    'payment_info', v_payment_record,
    'total_paid', v_total_paid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_reservation_atomic TO authenticated;