-- Fix atomic_checkin_guest to accept reserved rooms
CREATE OR REPLACE FUNCTION public.atomic_checkin_guest(
  p_tenant_id UUID,
  p_reservation_id UUID,
  p_room_id UUID,
  p_guest_data JSONB DEFAULT NULL,
  p_initial_charges JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id UUID;
  v_folio_id UUID;
  v_room_status TEXT;
  v_reservation_status TEXT;
  v_result JSONB;
BEGIN
  -- Validate tenant access
  IF NOT can_access_tenant(p_tenant_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Access denied to tenant',
      'reservation_id', p_reservation_id,
      'room_id', p_room_id,
      'folio_id', NULL,
      'guest_id', NULL
    );
  END IF;

  -- Check room status - allow both 'available' and 'reserved'
  SELECT status INTO v_room_status
  FROM public.rooms
  WHERE id = p_room_id AND tenant_id = p_tenant_id;

  IF v_room_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Room not found',
      'reservation_id', p_reservation_id,
      'room_id', p_room_id,
      'folio_id', NULL,
      'guest_id', NULL
    );
  END IF;

  IF v_room_status NOT IN ('available', 'reserved') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid room status: ' || v_room_status || '. Room must be available or reserved.',
      'reservation_id', p_reservation_id,
      'room_id', p_room_id,
      'folio_id', NULL,
      'guest_id', NULL
    );
  END IF;

  -- Check reservation status
  SELECT status INTO v_reservation_status
  FROM public.reservations
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;

  IF v_reservation_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found',
      'reservation_id', p_reservation_id,
      'room_id', p_room_id,
      'folio_id', NULL,
      'guest_id', NULL
    );
  END IF;

  IF v_reservation_status NOT IN ('confirmed', 'pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid reservation status: ' || v_reservation_status,
      'reservation_id', p_reservation_id,
      'room_id', p_room_id,
      'folio_id', NULL,
      'guest_id', NULL
    );
  END IF;

  -- Update guest information if provided
  IF p_guest_data IS NOT NULL THEN
    UPDATE public.guests
    SET
      first_name = COALESCE(p_guest_data->>'first_name', first_name),
      last_name = COALESCE(p_guest_data->>'last_name', last_name),
      email = COALESCE(p_guest_data->>'email', email),
      phone = COALESCE(p_guest_data->>'phone', phone),
      guest_id_number = COALESCE(p_guest_data->>'guest_id_number', guest_id_number),
      nationality = COALESCE(p_guest_data->>'nationality', nationality),
      address = COALESCE(p_guest_data->>'address', address),
      updated_at = NOW()
    WHERE id = (SELECT guest_id FROM public.reservations WHERE id = p_reservation_id)
    RETURNING id INTO v_guest_id;
  ELSE
    SELECT guest_id INTO v_guest_id
    FROM public.reservations
    WHERE id = p_reservation_id;
  END IF;

  -- Update reservation status to checked_in
  UPDATE public.reservations
  SET
    status = 'checked_in',
    checked_in_at = NOW(),
    updated_at = NOW()
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;

  -- Update room status to occupied
  UPDATE public.rooms
  SET
    status = 'occupied',
    current_guest = v_guest_id,
    updated_at = NOW()
  WHERE id = p_room_id AND tenant_id = p_tenant_id;

  -- Get or create folio
  SELECT id INTO v_folio_id
  FROM public.folios
  WHERE reservation_id = p_reservation_id AND status = 'open'
  LIMIT 1;

  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios (tenant_id, reservation_id, folio_number, status)
    VALUES (
      p_tenant_id,
      p_reservation_id,
      'FOL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(p_reservation_id::TEXT, 6, '0'),
      'open'
    )
    RETURNING id INTO v_folio_id;
  END IF;

  -- Add initial charges if provided
  IF jsonb_array_length(p_initial_charges) > 0 THEN
    INSERT INTO public.folio_charges (tenant_id, folio_id, charge_type, description, amount)
    SELECT
      p_tenant_id,
      v_folio_id,
      COALESCE((charge->>'charge_type')::TEXT, 'room'),
      (charge->>'description')::TEXT,
      (charge->>'amount')::NUMERIC
    FROM jsonb_array_elements(p_initial_charges) AS charge;
  END IF;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Check-in completed successfully',
    'reservation_id', p_reservation_id,
    'room_id', p_room_id,
    'folio_id', v_folio_id,
    'guest_id', v_guest_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Check-in failed: ' || SQLERRM,
      'reservation_id', p_reservation_id,
      'room_id', p_room_id,
      'folio_id', NULL,
      'guest_id', NULL
    );
END;
$$;