-- Enhanced get_or_create_folio function with better error handling
CREATE OR REPLACE FUNCTION public.get_or_create_folio(p_reservation_id uuid, p_tenant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  folio_id UUID;
  folio_number TEXT;
  reservation_total NUMERIC;
  reservation_exists BOOLEAN;
BEGIN
  -- Validate that reservation exists
  SELECT EXISTS(
    SELECT 1 FROM reservations 
    WHERE id = p_reservation_id AND tenant_id = p_tenant_id
  ) INTO reservation_exists;
  
  IF NOT reservation_exists THEN
    RAISE EXCEPTION 'Reservation not found or access denied';
  END IF;
  
  -- Try to get existing open folio
  SELECT id INTO folio_id
  FROM folios 
  WHERE reservation_id = p_reservation_id 
    AND status = 'open'
    AND tenant_id = p_tenant_id
  LIMIT 1;
  
  -- If no open folio exists, create one
  IF folio_id IS NULL THEN
    -- Get reservation total for initial charges
    SELECT total_amount INTO reservation_total
    FROM reservations
    WHERE id = p_reservation_id AND tenant_id = p_tenant_id;
    
    -- Generate unique folio number
    folio_number := 'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(substr(p_reservation_id::text, 1, 6), 6, '0');
    
    -- Insert folio
    INSERT INTO folios (
      tenant_id,
      reservation_id,
      folio_number,
      status,
      total_charges,
      total_payments
    ) VALUES (
      p_tenant_id,
      p_reservation_id,
      folio_number,
      'open',
      COALESCE(reservation_total, 0),
      0
    ) RETURNING id INTO folio_id;
    
    -- Add initial room charge if reservation has an amount
    IF COALESCE(reservation_total, 0) > 0 THEN
      INSERT INTO folio_charges (
        tenant_id,
        folio_id,
        charge_type,
        description,
        amount,
        posted_by
      ) VALUES (
        p_tenant_id,
        folio_id,
        'room',
        'Room charges',
        reservation_total,
        get_user_id()
      );
    END IF;
  END IF;
  
  -- Ensure folio_id is not null before returning
  IF folio_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create or retrieve folio';
  END IF;
  
  RETURN folio_id;
END;
$$;