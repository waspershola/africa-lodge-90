-- Fix atomic_checkin_guest to resolve reservation ID ambiguity
CREATE OR REPLACE FUNCTION public.atomic_checkin_guest(
  p_tenant_id UUID,
  p_reservation_id UUID,
  p_room_id UUID,
  p_guest_payload JSONB DEFAULT NULL,
  p_initial_charges JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  reservation_id UUID,
  room_id UUID,
  folio_id UUID,
  guest_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id UUID;
  v_reservation_id UUID;
  v_found_reservation_id UUID;
  v_reservation_status TEXT;
  v_folio_id UUID;
  v_room_status TEXT;
  v_folio_number TEXT;
  v_charge JSONB;
  v_conflict_count INTEGER;
BEGIN
  -- Validate tenant access
  IF NOT can_access_tenant(p_tenant_id) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID, 
      'Access denied to tenant'::TEXT;
    RETURN;
  END IF;

  -- Check for multiple active reservations for this room (conflict detection)
  SELECT COUNT(*) INTO v_conflict_count
  FROM reservations
  WHERE room_id = p_room_id
    AND tenant_id = p_tenant_id
    AND status IN ('reserved', 'pending', 'confirmed')
    AND id != COALESCE(p_reservation_id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF v_conflict_count > 1 THEN
    RAISE NOTICE 'Multiple active reservations found for room %. Conflict count: %', p_room_id, v_conflict_count;
  END IF;

  -- Validate room status (allow reserved, available, ready, vacant)
  SELECT status INTO v_room_status
  FROM rooms
  WHERE id = p_room_id AND tenant_id = p_tenant_id;

  IF v_room_status IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID,
      'Room not found'::TEXT;
    RETURN;
  END IF;

  IF v_room_status NOT IN ('available', 'ready', 'vacant', 'reserved') THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID,
      'Room status is ' || v_room_status || ' and cannot be assigned'::TEXT;
    RETURN;
  END IF;

  -- Handle reservation logic
  IF p_reservation_id IS NOT NULL THEN
    -- Verify the provided reservation exists and matches the room
    SELECT r.id, r.status INTO v_found_reservation_id, v_reservation_status
    FROM reservations r
    WHERE r.id = p_reservation_id
      AND r.tenant_id = p_tenant_id
      AND r.room_id = p_room_id
    LIMIT 1;

    IF v_found_reservation_id IS NULL THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID,
        'Reservation not found or does not match room'::TEXT;
      RETURN;
    END IF;

    v_reservation_id := v_found_reservation_id;
    v_guest_id := (SELECT guest_id FROM reservations WHERE id = v_reservation_id);

  ELSE
    -- Walk-in guest: find or create reservation
    -- First, try to find the most recent active reservation for this room
    SELECT r.id, r.status, r.guest_id 
    INTO v_found_reservation_id, v_reservation_status, v_guest_id
    FROM reservations r
    WHERE r.room_id = p_room_id
      AND r.tenant_id = p_tenant_id
      AND r.status IN ('reserved', 'pending', 'confirmed')
    ORDER BY r.created_at DESC
    LIMIT 1;

    IF v_found_reservation_id IS NOT NULL THEN
      -- Use existing reservation
      v_reservation_id := v_found_reservation_id;
      RAISE NOTICE 'Using existing reservation % for room %', v_reservation_id, p_room_id;
    ELSE
      -- Create new walk-in reservation
      IF p_guest_payload IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID,
          'Guest information required for walk-in check-in'::TEXT;
        RETURN;
      END IF;

      -- Create or find guest
      INSERT INTO guests (
        tenant_id, first_name, last_name, email, phone,
        guest_id_number, nationality, address
      ) VALUES (
        p_tenant_id,
        p_guest_payload->>'first_name',
        p_guest_payload->>'last_name',
        p_guest_payload->>'email',
        p_guest_payload->>'phone',
        p_guest_payload->>'guest_id_number',
        p_guest_payload->>'nationality',
        p_guest_payload->>'address'
      )
      ON CONFLICT (tenant_id, email) 
      DO UPDATE SET 
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        updated_at = now()
      RETURNING id INTO v_guest_id;

      -- Create walk-in reservation
      INSERT INTO reservations (
        tenant_id, room_id, guest_id, guest_name, guest_email, guest_phone,
        check_in_date, check_out_date, status, adults, children,
        room_rate, total_amount, reservation_number
      ) VALUES (
        p_tenant_id, p_room_id, v_guest_id,
        (p_guest_payload->>'first_name') || ' ' || (p_guest_payload->>'last_name'),
        p_guest_payload->>'email',
        p_guest_payload->>'phone',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 day',
        'checked_in',
        COALESCE((p_guest_payload->>'adults')::INTEGER, 1),
        COALESCE((p_guest_payload->>'children')::INTEGER, 0),
        (SELECT base_rate FROM room_types rt JOIN rooms r ON r.room_type_id = rt.id WHERE r.id = p_room_id),
        (SELECT base_rate FROM room_types rt JOIN rooms r ON r.room_type_id = rt.id WHERE r.id = p_room_id),
        'WI-' || to_char(now(), 'YYYYMMDD') || '-' || substr(p_room_id::text, 1, 8)
      )
      RETURNING id INTO v_reservation_id;

      RAISE NOTICE 'Created walk-in reservation % for guest % in room %', v_reservation_id, v_guest_id, p_room_id;
    END IF;
  END IF;

  -- Update reservation status to checked_in
  UPDATE reservations
  SET status = 'checked_in',
      actual_check_in = NOW(),
      updated_at = NOW()
  WHERE id = v_reservation_id;

  -- Update room status to occupied
  UPDATE rooms
  SET status = 'occupied',
      current_guest_id = v_guest_id,
      updated_at = NOW()
  WHERE id = p_room_id;

  -- Create or get folio
  SELECT id INTO v_folio_id
  FROM folios
  WHERE reservation_id = v_reservation_id AND status = 'open';

  IF v_folio_id IS NULL THEN
    v_folio_number := 'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || substr(v_reservation_id::text, 1, 8);
    
    INSERT INTO folios (
      tenant_id, reservation_id, folio_number, status
    ) VALUES (
      p_tenant_id, v_reservation_id, v_folio_number, 'open'
    )
    RETURNING id INTO v_folio_id;
  END IF;

  -- Add initial charges if provided
  FOR v_charge IN SELECT * FROM jsonb_array_elements(p_initial_charges)
  LOOP
    INSERT INTO folio_charges (
      tenant_id, folio_id, charge_type, description, amount, posted_by
    ) VALUES (
      p_tenant_id,
      v_folio_id,
      COALESCE(v_charge->>'charge_type', 'room'),
      v_charge->>'description',
      (v_charge->>'amount')::NUMERIC,
      auth.uid()
    );
  END LOOP;

  -- Log successful check-in
  RAISE NOTICE 'Check-in completed: Room %, Guest %, Reservation %, Folio %', 
    p_room_id, v_guest_id, v_reservation_id, v_folio_id;

  -- Return success
  RETURN QUERY SELECT 
    true,
    v_reservation_id,
    p_room_id,
    v_folio_id,
    v_guest_id,
    'Check-in completed successfully'::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Check-in error: %', SQLERRM;
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID,
      'Check-in failed: ' || SQLERRM;
END;
$$;