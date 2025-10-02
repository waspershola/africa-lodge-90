-- Fix cancel_reservation_atomic to handle 'reserved' status rooms
-- This ensures rooms in 'reserved' status become 'available' after cancellation

CREATE OR REPLACE FUNCTION public.cancel_reservation_atomic(
  p_tenant_id UUID,
  p_reservation_id UUID,
  p_cancel_reason TEXT DEFAULT NULL,
  p_refund_amount NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_folio_id UUID;
  v_current_status TEXT;
BEGIN
  -- Get reservation details and validate tenant
  SELECT r.room_id, r.status, f.id
  INTO v_room_id, v_current_status, v_folio_id
  FROM public.reservations r
  LEFT JOIN public.folios f ON f.reservation_id = r.id AND f.status = 'open'
  WHERE r.id = p_reservation_id 
    AND r.tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found'
    );
  END IF;
  
  -- Check if already cancelled
  IF v_current_status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation already cancelled'
    );
  END IF;
  
  -- Update reservation status
  UPDATE public.reservations
  SET 
    status = 'cancelled',
    cancel_reason = p_cancel_reason,
    cancelled_at = now(),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_reservation_id;
  
  -- Close associated folio if exists
  IF v_folio_id IS NOT NULL THEN
    UPDATE public.folios
    SET 
      status = 'closed',
      closed_at = now(),
      updated_at = now()
    WHERE id = v_folio_id;
    
    -- Add refund charge if applicable
    IF p_refund_amount > 0 THEN
      INSERT INTO public.folio_charges (
        tenant_id, folio_id, charge_type, description, amount
      ) VALUES (
        p_tenant_id, v_folio_id, 'refund', 
        'Cancellation refund: ' || COALESCE(p_cancel_reason, 'No reason provided'),
        -p_refund_amount
      );
    END IF;
  END IF;
  
  -- Update room status to available (handles both 'occupied' and 'reserved' status)
  UPDATE public.rooms
  SET 
    status = 'available',
    reservation_id = NULL,
    updated_at = now()
  WHERE id = v_room_id
    AND status IN ('occupied', 'reserved');
  
  -- Log the cancellation
  INSERT INTO public.audit_log (
    action, resource_type, resource_id, tenant_id,
    description, metadata
  ) VALUES (
    'CANCEL_RESERVATION',
    'RESERVATION',
    p_reservation_id,
    p_tenant_id,
    'Reservation cancelled: ' || COALESCE(p_cancel_reason, 'No reason provided'),
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'room_id', v_room_id,
      'refund_amount', p_refund_amount,
      'notes', p_notes
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reservation cancelled successfully',
    'reservation_id', p_reservation_id,
    'room_id', v_room_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;