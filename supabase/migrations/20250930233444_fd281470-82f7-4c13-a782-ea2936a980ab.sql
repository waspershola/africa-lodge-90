-- PHASE 1 FIX: Update atomic_checkin_guest to allow 'reserved' status
-- This fixes the "Room reserved and cannot be assigned" error during check-in

CREATE OR REPLACE FUNCTION public.atomic_checkin_guest(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_room_id uuid,
  p_guest_payload jsonb,
  p_initial_charges jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(
  success boolean,
  reservation_id uuid,
  room_id uuid,
  folio_id uuid,
  guest_id uuid,
  message text
) AS $$
DECLARE
  v_guest_id uuid;
  v_folio_id uuid;
  v_room_status text;
  v_reservation_status text;
  v_folio_number text;
  v_existing_folio_id uuid;
BEGIN
  -- Lock the reservation row FOR UPDATE to prevent races
  SELECT r.id, r.status INTO p_reservation_id, v_reservation_status
  FROM reservations r
  WHERE r.id = p_reservation_id AND r.tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, 'Reservation not found'::text;
    RETURN;
  END IF;

  -- Lock the room row and get current status
  SELECT r.id, r.status INTO p_room_id, v_room_status
  FROM rooms r
  WHERE r.id = p_room_id AND r.tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, 'Room not found'::text;
    RETURN;
  END IF;

  -- CRITICAL FIX: Allow check-in for 'reserved' rooms (for confirmed reservations)
  IF v_room_status NOT IN ('available', 'ready', 'vacant', 'reserved') THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, 
      format('Room is %s and cannot be checked in', v_room_status)::text;
    RETURN;
  END IF;

  -- Handle guest creation/update if payload provided
  IF p_guest_payload IS NOT NULL THEN
    INSERT INTO guests(
      tenant_id, 
      first_name, 
      last_name, 
      email, 
      phone,
      guest_id_number,
      nationality,
      address
    )
    VALUES (
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
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = EXCLUDED.phone,
      updated_at = now()
    RETURNING id INTO v_guest_id;
  END IF;

  -- Check for existing open folio (handle multiple folio edge case)
  SELECT id INTO v_existing_folio_id
  FROM folios
  WHERE reservation_id = p_reservation_id 
    AND tenant_id = p_tenant_id
    AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_folio_id IS NOT NULL THEN
    -- Reuse existing folio
    v_folio_id := v_existing_folio_id;
    
    -- Update folio with guest and room if not set
    UPDATE folios 
    SET 
      guest_id = COALESCE(guest_id, v_guest_id),
      updated_at = now()
    WHERE id = v_folio_id;
  ELSE
    -- Generate folio number
    v_folio_number := 'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || substring(p_reservation_id::text, 1, 6);
    
    -- Create new folio
    INSERT INTO folios (
      tenant_id, 
      reservation_id, 
      guest_id, 
      folio_number,
      status, 
      created_at
    )
    VALUES (
      p_tenant_id, 
      p_reservation_id, 
      v_guest_id,
      v_folio_number,
      'open', 
      now()
    )
    RETURNING id INTO v_folio_id;
  END IF;

  -- Insert initial charges (if any)
  IF p_initial_charges IS NOT NULL AND jsonb_array_length(p_initial_charges) > 0 THEN
    INSERT INTO folio_charges (
      tenant_id,
      folio_id, 
      charge_type,
      description, 
      amount, 
      posted_at
    )
    SELECT 
      p_tenant_id,
      v_folio_id, 
      COALESCE(c->>'charge_type', 'service'),
      c->>'description', 
      (c->>'amount')::numeric, 
      now()
    FROM jsonb_array_elements(p_initial_charges) AS t(c);
  END IF;

  -- Update reservation status and assign room
  UPDATE reservations
  SET 
    status = 'checked_in', 
    room_id = p_room_id,
    guest_id = COALESCE(guest_id, v_guest_id),
    updated_at = now()
  WHERE id = p_reservation_id;

  -- Update room status to occupied
  UPDATE rooms
  SET 
    status = 'occupied', 
    current_reservation_id = p_reservation_id, 
    updated_at = now()
  WHERE id = p_room_id;

  -- Log successful check-in
  INSERT INTO audit_log (
    tenant_id,
    action,
    resource_type,
    resource_id,
    actor_id,
    description,
    metadata
  ) VALUES (
    p_tenant_id,
    'CHECK_IN',
    'RESERVATION',
    p_reservation_id,
    auth.uid(),
    'Guest checked in via atomic function',
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'room_id', p_room_id,
      'folio_id', v_folio_id,
      'previous_room_status', v_room_status,
      'previous_reservation_status', v_reservation_status
    )
  );

  RETURN QUERY SELECT 
    true, 
    p_reservation_id, 
    p_room_id, 
    v_folio_id,
    v_guest_id,
    'Check-in successful'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add timezone-aware overstay detection function
CREATE OR REPLACE FUNCTION public.calculate_reservation_overstay(
  p_reservation_id uuid
) RETURNS boolean AS $$
DECLARE
  v_checkout_date date;
  v_checkout_time time := '12:00:00'::time;
  v_hotel_timezone text := 'UTC';
  v_checkout_datetime timestamptz;
  v_now timestamptz;
BEGIN
  -- Get checkout date from reservation
  SELECT check_out_date INTO v_checkout_date
  FROM reservations
  WHERE id = p_reservation_id AND status = 'checked_in';

  IF v_checkout_date IS NULL THEN
    RETURN false;
  END IF;

  -- Get hotel timezone from tenant settings (fallback to UTC)
  SELECT COALESCE(timezone, 'UTC') INTO v_hotel_timezone
  FROM tenants t
  JOIN reservations r ON r.tenant_id = t.id
  WHERE r.id = p_reservation_id;

  -- Calculate checkout datetime in hotel timezone
  v_checkout_datetime := (v_checkout_date::text || ' ' || v_checkout_time::text)::timestamp 
    AT TIME ZONE v_hotel_timezone;

  -- Get current time in hotel timezone
  v_now := now() AT TIME ZONE v_hotel_timezone;

  -- Return true if current time is past checkout time
  RETURN v_now > v_checkout_datetime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION public.atomic_checkin_guest IS 
'Atomically checks in a guest by updating reservation, room, and folio in a single transaction. Now supports reserved room check-ins.';

COMMENT ON FUNCTION public.calculate_reservation_overstay IS 
'Calculates if a reservation is overstayed based on hotel timezone and configured checkout time (12:00 PM by default).';