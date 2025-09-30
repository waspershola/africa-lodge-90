-- Phase 1: Atomic Check-in and Overstay Detection Functions

-- 1. Function to calculate if a reservation is in overstay status
-- Uses hotel timezone and checkout time (default 12:00)
CREATE OR REPLACE FUNCTION public.calculate_reservation_overstay(
  p_reservation_id uuid
) RETURNS boolean AS $$
DECLARE
  v_checkout_date date;
  v_checkout_time time := '12:00:00'::time;
  v_checkout_datetime timestamptz;
  v_now timestamptz := now();
  v_timezone text := 'UTC';
  v_tenant_id uuid;
BEGIN
  -- Get reservation checkout date and tenant
  SELECT check_out_date, tenant_id 
  INTO v_checkout_date, v_tenant_id
  FROM reservations 
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get hotel timezone from settings
  SELECT COALESCE(timezone, 'UTC') 
  INTO v_timezone
  FROM hotel_settings 
  WHERE tenant_id = v_tenant_id
  LIMIT 1;

  -- Construct checkout datetime in hotel timezone
  v_checkout_datetime := (v_checkout_date::text || ' ' || v_checkout_time::text)::timestamp 
    AT TIME ZONE v_timezone;

  -- Return true if current time is past checkout time
  RETURN v_now > v_checkout_datetime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Atomic check-in function to prevent race conditions
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
BEGIN
  -- Start transaction isolation
  BEGIN
    -- 1. Lock and verify room availability
    SELECT status INTO v_room_status
    FROM rooms
    WHERE id = p_room_id 
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, 'Room not found'::text;
      RETURN;
    END IF;

    IF v_room_status NOT IN ('available', 'ready', 'vacant') THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, 
        ('Room is ' || v_room_status || ' and cannot be assigned')::text;
      RETURN;
    END IF;

    -- 2. Lock and verify reservation
    SELECT status INTO v_reservation_status
    FROM reservations
    WHERE id = p_reservation_id 
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, 'Reservation not found'::text;
      RETURN;
    END IF;

    IF v_reservation_status NOT IN ('confirmed', 'pending') THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::uuid, 
        ('Reservation is already ' || v_reservation_status)::text;
      RETURN;
    END IF;

    -- 3. Create or update guest if payload provided
    IF p_guest_payload IS NOT NULL AND p_guest_payload != '{}'::jsonb THEN
      INSERT INTO guests (
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
        NULLIF(p_guest_payload->>'email', ''),
        NULLIF(p_guest_payload->>'phone', ''),
        NULLIF(p_guest_payload->>'guest_id_number', ''),
        NULLIF(p_guest_payload->>'nationality', ''),
        NULLIF(p_guest_payload->>'address', '')
      )
      ON CONFLICT (tenant_id, email) 
      WHERE email IS NOT NULL
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = COALESCE(EXCLUDED.phone, guests.phone),
        updated_at = now()
      RETURNING id INTO v_guest_id;
    ELSE
      -- Get existing guest from reservation
      SELECT guest_id INTO v_guest_id
      FROM reservations
      WHERE id = p_reservation_id;
    END IF;

    -- 4. Generate folio number
    v_folio_number := 'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || 
                      LPAD(substring(p_reservation_id::text from 1 for 6), 6, '0');

    -- 5. Create folio
    INSERT INTO folios (
      tenant_id,
      reservation_id,
      folio_number,
      status
    )
    VALUES (
      p_tenant_id,
      p_reservation_id,
      v_folio_number,
      'open'
    )
    RETURNING id INTO v_folio_id;

    -- 6. Add initial charges if provided
    IF jsonb_array_length(p_initial_charges) > 0 THEN
      INSERT INTO folio_charges (
        tenant_id,
        folio_id,
        charge_type,
        description,
        amount
      )
      SELECT 
        p_tenant_id,
        v_folio_id,
        COALESCE(charge->>'charge_type', 'room')::text,
        charge->>'description',
        (charge->>'amount')::numeric
      FROM jsonb_array_elements(p_initial_charges) AS charge;
    END IF;

    -- 7. Update reservation status and link room
    UPDATE reservations
    SET 
      status = 'checked_in',
      room_id = p_room_id,
      guest_id = COALESCE(v_guest_id, guest_id),
      updated_at = now()
    WHERE id = p_reservation_id;

    -- 8. Update room status to occupied
    UPDATE rooms
    SET 
      status = 'occupied',
      updated_at = now()
    WHERE id = p_room_id;

    -- Return success
    RETURN QUERY SELECT 
      true, 
      p_reservation_id, 
      p_room_id, 
      v_folio_id, 
      v_guest_id,
      'Check-in completed successfully'::text;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback happens automatically
      RETURN QUERY SELECT 
        false, 
        NULL::uuid, 
        NULL::uuid, 
        NULL::uuid, 
        NULL::uuid,
        ('Check-in failed: ' || SQLERRM)::text;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions (adjust as needed for your security model)
GRANT EXECUTE ON FUNCTION calculate_reservation_overstay(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_checkin_guest(uuid, uuid, uuid, jsonb, jsonb) TO authenticated;

-- 4. Add helpful comment
COMMENT ON FUNCTION atomic_checkin_guest IS 
  'Atomically checks in a guest: creates/updates guest, updates reservation, assigns room, creates folio, and adds initial charges. All operations happen in a single transaction.';

COMMENT ON FUNCTION calculate_reservation_overstay IS 
  'Calculates if a reservation is in overstay status based on hotel timezone and checkout time (12:00 PM default).';