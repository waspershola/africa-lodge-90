-- Fix atomic_checkin_guest to preserve existing folio charges during check-in
-- First drop all existing versions to avoid function signature conflicts

DROP FUNCTION IF EXISTS public.atomic_checkin_guest(uuid, uuid, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.atomic_checkin_guest(uuid, jsonb, jsonb, uuid, jsonb);

-- Create the correct version that matches frontend calls and preserves existing charges
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
  v_existing_charges_count INTEGER;
  v_tax_breakdown RECORD;
  v_guest_tax_exempt BOOLEAN := false;
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
  
  -- Get guest tax exemption status
  IF v_guest_id IS NOT NULL THEN
    SELECT COALESCE(tax_exempt, false) INTO v_guest_tax_exempt
    FROM public.guests
    WHERE id = v_guest_id AND tenant_id = p_tenant_id;
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
  
  -- Update room to occupied
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
  LIMIT 1;
  
  IF v_folio_id IS NULL THEN
    -- Create new folio if it doesn't exist
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
    
    v_existing_charges_count := 0;
  ELSE
    -- Folio exists, ensure it's open and count existing charges
    UPDATE public.folios
    SET status = 'open', updated_at = NOW()
    WHERE id = v_folio_id;
    
    SELECT COUNT(*) INTO v_existing_charges_count
    FROM public.folio_charges
    WHERE folio_id = v_folio_id;
  END IF;
  
  -- Add initial charges ONLY if no charges exist yet (avoid duplicates)
  -- This preserves charges created during "Assign Room" step
  IF v_existing_charges_count = 0 AND jsonb_array_length(p_initial_charges) > 0 THEN
    FOR v_charge IN SELECT * FROM jsonb_array_elements(p_initial_charges)
    LOOP
      -- Calculate taxes for this charge
      SELECT * INTO v_tax_breakdown
      FROM calculate_charge_with_taxes(
        (v_charge->>'amount')::numeric,
        COALESCE(v_charge->>'charge_type', 'room'),
        p_tenant_id,
        COALESCE((v_charge->>'is_taxable')::boolean, true),
        COALESCE((v_charge->>'is_service_chargeable')::boolean, true),
        v_guest_tax_exempt
      );

      INSERT INTO public.folio_charges (
        tenant_id,
        folio_id,
        charge_type,
        description,
        base_amount,
        vat_amount,
        service_charge_amount,
        amount,
        is_taxable,
        is_service_chargeable,
        posted_by
      ) VALUES (
        p_tenant_id,
        v_folio_id,
        COALESCE(v_charge->>'charge_type', 'room'),
        v_charge->>'description',
        v_tax_breakdown.base_amount,
        v_tax_breakdown.vat_amount,
        v_tax_breakdown.service_charge_amount,
        v_tax_breakdown.total_amount,
        COALESCE((v_charge->>'is_taxable')::boolean, true),
        COALESCE((v_charge->>'is_service_chargeable')::boolean, true),
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

COMMENT ON FUNCTION public.atomic_checkin_guest IS 
'Atomically checks in a guest. Preserves existing folio charges from reservation/assign room steps to avoid duplicates. Calculates taxes for new charges only.';
