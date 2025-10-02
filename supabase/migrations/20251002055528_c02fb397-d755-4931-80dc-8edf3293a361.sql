-- Production Schema Fix: Drop old functions, add columns, recreate functions
-- Part 1: Drop existing functions to allow recreation with new signatures
DROP FUNCTION IF EXISTS public.cancel_reservation_atomic(uuid, uuid, uuid, text, numeric, text);
DROP FUNCTION IF EXISTS public.cancel_reservation_atomic(uuid, uuid);
DROP FUNCTION IF EXISTS public.atomic_checkin_guest(uuid, uuid, uuid, jsonb, jsonb);

-- Part 2: Add cancellation tracking columns to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_notes text;

-- Part 3: Add reservation_id to rooms for bidirectional relationship
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_reservation_id ON public.rooms(reservation_id) WHERE reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_cancelled_at ON public.reservations(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Part 4: Recreate cancel_reservation_atomic with proper schema
CREATE OR REPLACE FUNCTION public.cancel_reservation_atomic(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_cancelled_by uuid DEFAULT NULL,
  p_cancellation_reason text DEFAULT NULL,
  p_refund_amount numeric DEFAULT 0,
  p_cancellation_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
DECLARE
  v_reservation_id uuid;
  v_room_id uuid;
  v_folio_id uuid;
  v_guest_name text;
  v_old_status text;
  v_rows_affected integer := 0;
BEGIN
  -- Lock and get reservation details
  SELECT res.id, res.room_id, res.status, res.guest_name
  INTO v_reservation_id, v_room_id, v_old_status, v_guest_name
  FROM public.reservations res
  WHERE res.id = p_reservation_id 
    AND res.tenant_id = p_tenant_id
  FOR UPDATE NOWAIT;

  IF v_reservation_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found or already locked'
    );
  END IF;

  IF v_old_status IN ('cancelled', 'checked_out', 'no_show') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Cannot cancel reservation with status: %s', v_old_status)
    );
  END IF;

  -- Update reservation with cancellation details
  UPDATE public.reservations
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_cancellation_reason,
    refund_amount = p_refund_amount,
    cancellation_notes = p_cancellation_notes,
    updated_at = now()
  WHERE id = v_reservation_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to update reservation status'
    );
  END IF;

  -- Close any open folios
  UPDATE public.folios
  SET 
    status = 'closed',
    closed_at = now(),
    closed_by = COALESCE(p_cancelled_by, get_user_id()),
    updated_at = now()
  WHERE reservation_id = v_reservation_id 
    AND status = 'open'
  RETURNING id INTO v_folio_id;

  -- Free up the room if it was assigned to this reservation
  IF v_room_id IS NOT NULL THEN
    UPDATE public.rooms
    SET 
      status = 'available',
      reservation_id = NULL,
      updated_at = now()
    WHERE id = v_room_id 
      AND (reservation_id = v_reservation_id OR status = 'occupied');
  END IF;

  -- Audit log
  INSERT INTO public.audit_log (
    action, resource_type, resource_id, tenant_id,
    description, metadata, actor_id
  ) VALUES (
    'CANCEL_RESERVATION',
    'RESERVATION',
    v_reservation_id,
    p_tenant_id,
    format('Cancelled reservation for %s', v_guest_name),
    jsonb_build_object(
      'old_status', v_old_status,
      'cancellation_reason', p_cancellation_reason,
      'refund_amount', p_refund_amount,
      'room_id', v_room_id
    ),
    p_cancelled_by
  );

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'room_id', v_room_id,
    'folio_id', v_folio_id,
    'message', 'Reservation cancelled successfully'
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation is currently being processed. Please try again.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Cancellation failed: %s', SQLERRM)
    );
END;
$$;

-- Part 5: Recreate atomic_checkin_guest with qualified column names
CREATE OR REPLACE FUNCTION public.atomic_checkin_guest(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_room_id uuid,
  p_guest_data jsonb DEFAULT NULL,
  p_initial_charges jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
DECLARE
  v_reservation_id uuid;
  v_room_id uuid;
  v_guest_id uuid;
  v_folio_id uuid;
  v_room_status text;
  v_reservation_status text;
  v_guest_name text;
  v_charge jsonb;
  v_rows_affected integer := 0;
BEGIN
  -- Lock reservation
  SELECT res.id, res.room_id, res.status, res.guest_id, res.guest_name
  INTO v_reservation_id, v_room_id, v_reservation_status, v_guest_id, v_guest_name
  FROM public.reservations res
  WHERE res.id = p_reservation_id 
    AND res.tenant_id = p_tenant_id
  FOR UPDATE NOWAIT;

  IF v_reservation_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found'
    );
  END IF;

  IF v_reservation_status = 'checked_in' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Guest already checked in'
    );
  END IF;

  -- Lock room
  SELECT rooms.id, rooms.status
  INTO v_room_id, v_room_status
  FROM public.rooms
  WHERE rooms.id = p_room_id 
    AND rooms.tenant_id = p_tenant_id
  FOR UPDATE NOWAIT;

  IF v_room_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Room not found'
    );
  END IF;

  IF v_room_status NOT IN ('available', 'cleaning') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Room is not available (status: %s)', v_room_status)
    );
  END IF;

  -- Update or create guest if guest_data provided
  IF p_guest_data IS NOT NULL THEN
    IF v_guest_id IS NOT NULL THEN
      UPDATE public.guests g
      SET 
        first_name = COALESCE(p_guest_data->>'first_name', g.first_name),
        last_name = COALESCE(p_guest_data->>'last_name', g.last_name),
        email = COALESCE(p_guest_data->>'email', g.email),
        phone = COALESCE(p_guest_data->>'phone', g.phone),
        guest_id_number = COALESCE(p_guest_data->>'guest_id_number', g.guest_id_number),
        nationality = COALESCE(p_guest_data->>'nationality', g.nationality),
        address = COALESCE(p_guest_data->>'address', g.address),
        updated_at = now()
      WHERE g.id = v_guest_id;
    ELSE
      INSERT INTO public.guests (
        tenant_id, first_name, last_name, email, phone,
        guest_id_number, nationality, address
      ) VALUES (
        p_tenant_id,
        p_guest_data->>'first_name',
        p_guest_data->>'last_name',
        p_guest_data->>'email',
        p_guest_data->>'phone',
        p_guest_data->>'guest_id_number',
        p_guest_data->>'nationality',
        p_guest_data->>'address'
      )
      RETURNING guests.id INTO v_guest_id;
    END IF;
  END IF;

  -- Update reservation to checked_in
  UPDATE public.reservations res
  SET 
    status = 'checked_in',
    room_id = p_room_id,
    guest_id = COALESCE(v_guest_id, res.guest_id),
    checked_in_at = now(),
    updated_at = now()
  WHERE res.id = v_reservation_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to update reservation'
    );
  END IF;

  -- Update room status to occupied and link reservation
  UPDATE public.rooms
  SET 
    status = 'occupied',
    reservation_id = v_reservation_id,
    updated_at = now()
  WHERE rooms.id = p_room_id;

  -- Get or create folio
  SELECT f.id INTO v_folio_id
  FROM public.folios f
  WHERE f.reservation_id = v_reservation_id 
    AND f.status = 'open'
  LIMIT 1;

  IF v_folio_id IS NULL THEN
    INSERT INTO public.folios (
      tenant_id, reservation_id, folio_number, status
    ) VALUES (
      p_tenant_id,
      v_reservation_id,
      'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || substr(v_reservation_id::text, 1, 8),
      'open'
    )
    RETURNING folios.id INTO v_folio_id;
  END IF;

  -- Add initial charges if provided
  IF jsonb_array_length(p_initial_charges) > 0 THEN
    FOR v_charge IN SELECT * FROM jsonb_array_elements(p_initial_charges)
    LOOP
      INSERT INTO public.folio_charges (
        tenant_id, folio_id, charge_type, description, amount, posted_by
      ) VALUES (
        p_tenant_id,
        v_folio_id,
        v_charge->>'charge_type',
        v_charge->>'description',
        (v_charge->>'amount')::numeric,
        get_user_id()
      );
    END LOOP;
  END IF;

  -- Audit log
  INSERT INTO public.audit_log (
    action, resource_type, resource_id, tenant_id,
    description, metadata, actor_id
  ) VALUES (
    'CHECK_IN',
    'RESERVATION',
    v_reservation_id,
    p_tenant_id,
    format('Checked in guest: %s to room %s', v_guest_name, p_room_id),
    jsonb_build_object(
      'room_id', p_room_id,
      'guest_id', v_guest_id,
      'folio_id', v_folio_id
    ),
    get_user_id()
  );

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'room_id', p_room_id,
    'folio_id', v_folio_id,
    'guest_id', v_guest_id,
    'message', 'Check-in completed successfully'
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Resource is currently locked. Please try again.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Check-in failed: %s', SQLERRM)
    );
END;
$$;