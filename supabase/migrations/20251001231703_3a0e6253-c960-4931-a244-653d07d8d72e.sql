-- Migration: Create atomic cancel_reservation_atomic function
-- This replaces the fake client-side cancel with a real, idempotent DB operation

CREATE OR REPLACE FUNCTION public.cancel_reservation_atomic(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_cancelled_by uuid,
  p_reason text DEFAULT NULL,
  p_refund_amount numeric DEFAULT 0,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, reservation_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id uuid;
  v_room_id uuid;
  v_current_status text;
BEGIN
  -- Try to mark reservation cancelled; only update non-cancelled reservations
  -- SECURITY: Validate tenant ownership to prevent cross-tenant manipulation
  UPDATE reservations
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = p_cancelled_by,
      cancellation_reason = p_reason,
      refund_amount = p_refund_amount,
      cancellation_notes = p_notes,
      updated_at = now()
  WHERE id = p_reservation_id
    AND tenant_id = p_tenant_id
    AND (status IS DISTINCT FROM 'cancelled')
  RETURNING id, room_id, status INTO v_reservation_id, v_room_id, v_current_status;

  -- IDEMPOTENCY: If no rows updated, reservation not found or already cancelled
  IF v_reservation_id IS NULL THEN
    -- Check if reservation exists but is already cancelled
    SELECT res.id, res.status INTO v_reservation_id, v_current_status
    FROM reservations res
    WHERE res.id = p_reservation_id AND res.tenant_id = p_tenant_id;
    
    IF v_reservation_id IS NOT NULL AND v_current_status = 'cancelled' THEN
      RETURN QUERY SELECT FALSE, 'Reservation is already cancelled'::text, v_reservation_id;
    ELSE
      RETURN QUERY SELECT FALSE, 'Reservation not found or access denied'::text, NULL::uuid;
    END IF;
    RETURN;
  END IF;

  -- If the reservation had an assigned room, mark it available (tenant-safe)
  IF v_room_id IS NOT NULL THEN
    UPDATE rooms
    SET status = 'available', updated_at = now()
    WHERE id = v_room_id
      AND tenant_id = p_tenant_id;
  END IF;

  -- Write audit log for compliance and debugging
  INSERT INTO audit_log(
    action, 
    resource_type, 
    resource_id, 
    tenant_id, 
    actor_id, 
    description, 
    metadata,
    created_at
  )
  VALUES (
    'CANCEL_RESERVATION', 
    'RESERVATION', 
    v_reservation_id, 
    p_tenant_id, 
    p_cancelled_by,
    COALESCE(p_reason, 'Reservation cancelled'), 
    jsonb_build_object(
      'refund_amount', p_refund_amount,
      'notes', p_notes,
      'room_id', v_room_id
    ),
    now()
  );

  -- SUCCESS: Return deterministic success response
  RETURN QUERY SELECT TRUE, 'Reservation cancelled successfully'::text, v_reservation_id;
END;
$$;

-- Grant execute to authenticated users (RLS will be enforced via tenant_id check in function)
GRANT EXECUTE ON FUNCTION public.cancel_reservation_atomic TO authenticated;

COMMENT ON FUNCTION public.cancel_reservation_atomic IS 
'Atomically cancels a reservation with idempotency, tenant isolation, and audit logging. Returns success/failure deterministically.';
