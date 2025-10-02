
-- Migration: Fix critical SQL bugs in atomic functions (simplified)
-- Priority: P0 CRITICAL

-- =====================================================
-- FIX 1: atomic_checkout - Fix variable assignment bug
-- =====================================================
CREATE OR REPLACE FUNCTION public.atomic_checkout(
  p_tenant_id uuid, 
  p_reservation_id uuid
)
RETURNS TABLE(success boolean, folio_id uuid, room_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_reservation_id uuid;  -- NEW: Proper variable
  v_folio_id uuid;
  v_room_id uuid;
  v_balance numeric;
  v_reservation_status text;
BEGIN
  -- Validate tenant access
  IF NOT can_access_tenant(p_tenant_id) THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 'Access denied'::text;
    RETURN;
  END IF;

  BEGIN
    -- 1. Lock and verify reservation (FIX: use v_reservation_id, not p_reservation_id)
    SELECT res.id, res.room_id, res.status 
    INTO v_reservation_id, v_room_id, v_reservation_status
    FROM reservations res
    WHERE res.id = p_reservation_id 
      AND res.tenant_id = p_tenant_id
    FOR UPDATE;

    IF v_reservation_id IS NULL THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 'Reservation not found'::text;
      RETURN;
    END IF;

    IF v_reservation_status != 'checked_in' THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 
        ('Reservation is ' || v_reservation_status || ', cannot check out')::text;
      RETURN;
    END IF;

    -- 2. Lock and get folio
    SELECT f.id, f.balance 
    INTO v_folio_id, v_balance
    FROM folios f
    WHERE f.reservation_id = p_reservation_id 
      AND f.tenant_id = p_tenant_id
      AND f.status = 'open'
    FOR UPDATE;

    IF v_folio_id IS NULL THEN
      RETURN QUERY SELECT false, NULL::uuid, v_room_id, 'Folio not found'::text;
      RETURN;
    END IF;

    -- 3. Check balance
    IF v_balance > 0 THEN
      RETURN QUERY SELECT false, v_folio_id, v_room_id, 
        ('Outstanding balance: ₦' || v_balance::text)::text;
      RETURN;
    END IF;

    -- 4. Close folio
    UPDATE folios f
    SET status = 'closed', closed_at = now(), closed_by = get_user_id(), updated_at = now()
    WHERE f.id = v_folio_id;

    -- 5. Update reservation
    UPDATE reservations res
    SET status = 'checked_out', checked_out_at = now(), updated_at = now()
    WHERE res.id = p_reservation_id;

    -- 6. Update room to dirty
    UPDATE rooms r
    SET status = 'dirty', updated_at = now()
    WHERE r.id = v_room_id AND r.tenant_id = p_tenant_id;

    -- Success
    RETURN QUERY SELECT true, v_folio_id, v_room_id, 'Checkout successful'::text;

  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, ('Error: ' || SQLERRM)::text;
  END;
END;
$$;

-- =====================================================
-- FIX 2: cancel_reservation_atomic - Better room update
-- =====================================================
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
SET search_path TO 'public'
SET statement_timeout TO '15s'
AS $$
DECLARE
  v_reservation_id uuid;
  v_room_id uuid;
  v_current_status text;
  v_rows_updated integer;
BEGIN
  -- Validate tenant
  IF NOT can_access_tenant(p_tenant_id) THEN
    RETURN QUERY SELECT FALSE, 'Access denied'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Update reservation
  UPDATE reservations res
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason,
    refund_amount = p_refund_amount,
    cancellation_notes = p_notes,
    updated_at = now()
  WHERE res.id = p_reservation_id
    AND res.tenant_id = p_tenant_id
    AND (res.status IS DISTINCT FROM 'cancelled')
  RETURNING res.id, res.room_id INTO v_reservation_id, v_room_id;

  -- Check result
  IF v_reservation_id IS NULL THEN
    SELECT res.id, res.status 
    INTO v_reservation_id, v_current_status
    FROM reservations res
    WHERE res.id = p_reservation_id AND res.tenant_id = p_tenant_id;
    
    IF v_reservation_id IS NOT NULL AND v_current_status = 'cancelled' THEN
      RETURN QUERY SELECT FALSE, 'Already cancelled'::text, v_reservation_id;
    ELSE
      RETURN QUERY SELECT FALSE, 'Reservation not found'::text, NULL::uuid;
    END IF;
    RETURN;
  END IF;

  -- Update room if assigned
  IF v_room_id IS NOT NULL THEN
    UPDATE rooms r
    SET status = 'available', reservation_id = NULL, updated_at = now()
    WHERE r.id = v_room_id AND r.tenant_id = p_tenant_id;
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    
    IF v_rows_updated = 0 THEN
      RAISE WARNING 'Room % not updated', v_room_id;
    END IF;
  END IF;

  -- Audit log
  INSERT INTO audit_log(
    action, resource_type, resource_id, tenant_id, actor_id,
    description, metadata, created_at
  )
  VALUES (
    'CANCEL_RESERVATION', 'RESERVATION', v_reservation_id, p_tenant_id, p_cancelled_by,
    COALESCE(p_reason, 'Cancelled'),
    jsonb_build_object('refund_amount', p_refund_amount, 'room_id', v_room_id, 'room_updated', v_rows_updated > 0),
    now()
  );

  RETURN QUERY SELECT TRUE, 'Cancelled successfully'::text, v_reservation_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, ('Failed: ' || SQLERRM)::text, NULL::uuid;
END;
$$;

COMMENT ON FUNCTION public.atomic_checkout IS 'Fixed: ambiguous column references and variable declarations';
COMMENT ON FUNCTION public.cancel_reservation_atomic IS 'Fixed: room status update with proper diagnostics';
