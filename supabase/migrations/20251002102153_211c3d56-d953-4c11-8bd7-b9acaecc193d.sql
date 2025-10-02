-- Fix all functions that incorrectly reference non-existent current_guest column

-- Fix 1: Update atomic_checkin_guest to remove current_guest references
CREATE OR REPLACE FUNCTION public.atomic_checkin_guest(
  p_tenant_id UUID,
  p_reservation_id UUID,
  p_room_id UUID,
  p_guest_data JSONB DEFAULT NULL,
  p_initial_charges JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_status TEXT;
  v_reservation_status TEXT;
  v_folio_id UUID;
  v_guest_id UUID;
  v_charge JSONB;
BEGIN
  -- Validate room status (allow both available and reserved)
  SELECT status INTO v_room_status
  FROM public.rooms
  WHERE id = p_room_id AND tenant_id = p_tenant_id;
  
  IF v_room_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Room not found'
    );
  END IF;
  
  IF v_room_status NOT IN ('available', 'reserved') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid room status: ' || v_room_status
    );
  END IF;
  
  -- Validate reservation
  SELECT status, guest_id INTO v_reservation_status, v_guest_id
  FROM public.reservations
  WHERE id = p_reservation_id 
    AND tenant_id = p_tenant_id
    AND room_id = p_room_id;
  
  IF v_reservation_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found or room mismatch'
    );
  END IF;
  
  IF v_reservation_status = 'checked_in' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Guest already checked in'
    );
  END IF;
  
  -- Update guest data if provided
  IF p_guest_data IS NOT NULL AND v_guest_id IS NOT NULL THEN
    UPDATE public.guests
    SET
      phone = COALESCE(p_guest_data->>'phone', phone),
      address = COALESCE(p_guest_data->>'address', address),
      id_type = COALESCE(p_guest_data->>'id_type', id_type),
      id_number = COALESCE(p_guest_data->>'id_number', id_number),
      updated_at = NOW()
    WHERE id = v_guest_id AND tenant_id = p_tenant_id;
  END IF;
  
  -- Update room to occupied (remove current_guest reference)
  UPDATE public.rooms
  SET
    status = 'occupied',
    reservation_id = p_reservation_id,
    updated_at = NOW()
  WHERE id = p_room_id AND tenant_id = p_tenant_id;
  
  -- Update reservation to checked_in
  UPDATE public.reservations
  SET
    status = 'checked_in',
    checked_in_at = NOW(),
    updated_at = NOW()
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;
  
  -- Get or create folio
  SELECT id INTO v_folio_id
  FROM public.folios
  WHERE reservation_id = p_reservation_id
    AND tenant_id = p_tenant_id
    AND status = 'open'
  LIMIT 1;
  
  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios (
      tenant_id,
      reservation_id,
      folio_number,
      status
    ) VALUES (
      p_tenant_id,
      p_reservation_id,
      'FOL-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(p_reservation_id::text, 6, '0'),
      'open'
    ) RETURNING id INTO v_folio_id;
  END IF;
  
  -- Add initial charges if provided
  IF jsonb_array_length(p_initial_charges) > 0 THEN
    FOR v_charge IN SELECT * FROM jsonb_array_elements(p_initial_charges)
    LOOP
      INSERT INTO public.folio_charges (
        tenant_id,
        folio_id,
        charge_type,
        description,
        amount,
        posted_by
      ) VALUES (
        p_tenant_id,
        v_folio_id,
        v_charge->>'charge_type',
        v_charge->>'description',
        (v_charge->>'amount')::NUMERIC,
        auth.uid()
      );
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Check-in completed successfully',
    'reservation_id', p_reservation_id,
    'room_id', p_room_id,
    'folio_id', v_folio_id,
    'guest_id', v_guest_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Check-in failed: ' || SQLERRM
  );
END;
$$;

-- Fix 2: Update atomic_checkout to remove current_guest references
CREATE OR REPLACE FUNCTION public.atomic_checkout(
  p_tenant_id UUID,
  p_reservation_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  folio_id UUID,
  room_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_folio_id UUID;
  v_balance NUMERIC;
BEGIN
  -- Get room and folio for this reservation
  SELECT r.room_id, f.id, f.balance
  INTO v_room_id, v_folio_id, v_balance
  FROM public.reservations r
  LEFT JOIN public.folios f ON f.reservation_id = r.id AND f.status = 'open'
  WHERE r.id = p_reservation_id 
    AND r.tenant_id = p_tenant_id
    AND r.status = 'checked_in';
  
  IF v_room_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'No active reservation found'::TEXT;
    RETURN;
  END IF;
  
  -- Close folio
  IF v_folio_id IS NOT NULL THEN
    UPDATE public.folios
    SET status = 'closed',
        closed_at = NOW(),
        closed_by = auth.uid(),
        updated_at = NOW()
    WHERE id = v_folio_id;
  END IF;
  
  -- Update reservation
  UPDATE public.reservations
  SET status = 'checked_out',
      checked_out_at = NOW(),
      updated_at = NOW()
  WHERE id = p_reservation_id;
  
  -- Update room (remove current_guest reference)
  UPDATE public.rooms
  SET status = 'dirty',
      reservation_id = NULL,
      updated_at = NOW()
  WHERE id = v_room_id AND tenant_id = p_tenant_id;
  
  RETURN QUERY SELECT true, v_folio_id, v_room_id, 'Checkout completed successfully'::TEXT;
END;
$$;

-- Fix 3: Update atomic_checkout_v2 to remove current_guest references
CREATE OR REPLACE FUNCTION public.atomic_checkout_v2(
  p_tenant_id UUID,
  p_reservation_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  folio_id UUID,
  room_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_folio_id UUID;
  v_balance NUMERIC;
  v_lock_acquired BOOLEAN;
BEGIN
  -- Try to acquire advisory lock
  v_lock_acquired := pg_try_advisory_xact_lock(hashtext(p_reservation_id::text));
  
  IF NOT v_lock_acquired THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Checkout already in progress'::TEXT;
    RETURN;
  END IF;
  
  -- Get room and folio for this reservation
  SELECT r.room_id, f.id, f.balance
  INTO v_room_id, v_folio_id, v_balance
  FROM public.reservations r
  LEFT JOIN public.folios f ON f.reservation_id = r.id AND f.status = 'open'
  WHERE r.id = p_reservation_id 
    AND r.tenant_id = p_tenant_id
    AND r.status = 'checked_in';
  
  IF v_room_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'No active reservation found'::TEXT;
    RETURN;
  END IF;
  
  -- Close folio
  IF v_folio_id IS NOT NULL THEN
    UPDATE public.folios
    SET status = 'closed',
        closed_at = NOW(),
        closed_by = auth.uid(),
        updated_at = NOW()
    WHERE id = v_folio_id;
  END IF;
  
  -- Update reservation
  UPDATE public.reservations
  SET status = 'checked_out',
      checked_out_at = NOW(),
      updated_at = NOW()
  WHERE id = p_reservation_id;
  
  -- Update room (remove current_guest reference)
  UPDATE public.rooms
  SET status = 'dirty',
      reservation_id = NULL,
      updated_at = NOW()
  WHERE id = v_room_id AND tenant_id = p_tenant_id;
  
  RETURN QUERY SELECT true, v_folio_id, v_room_id, 'Checkout completed successfully'::TEXT;
END;
$$;

-- Fix 4: Update cancel_reservation_atomic to remove current_guest references
CREATE OR REPLACE FUNCTION public.cancel_reservation_atomic(
  p_reservation_id UUID,
  p_tenant_id UUID,
  p_cancelled_by UUID,
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_room_status TEXT;
  v_reservation_status TEXT;
BEGIN
  -- Get reservation details
  SELECT room_id, status 
  INTO v_room_id, v_reservation_status
  FROM public.reservations
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found'
    );
  END IF;
  
  -- Check if reservation can be cancelled
  IF v_reservation_status IN ('checked_out', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cannot cancel reservation with status: ' || v_reservation_status
    );
  END IF;
  
  -- Get current room status
  SELECT status INTO v_room_status
  FROM public.rooms
  WHERE id = v_room_id AND tenant_id = p_tenant_id;
  
  -- Update reservation to cancelled
  UPDATE public.reservations
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_cancellation_reason,
    updated_at = NOW()
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;
  
  -- Update room status to available if it's currently reserved or occupied (remove current_guest reference)
  UPDATE public.rooms
  SET
    status = 'available',
    reservation_id = NULL,
    updated_at = NOW()
  WHERE id = v_room_id 
    AND tenant_id = p_tenant_id
    AND status IN ('reserved', 'occupied');
  
  -- Close any open folios for this reservation
  UPDATE public.folios
  SET
    status = 'closed',
    closed_at = NOW(),
    closed_by = p_cancelled_by,
    updated_at = NOW()
  WHERE reservation_id = p_reservation_id
    AND tenant_id = p_tenant_id
    AND status = 'open';
  
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
      'message', 'Cancellation failed: ' || SQLERRM
    );
END;
$$;