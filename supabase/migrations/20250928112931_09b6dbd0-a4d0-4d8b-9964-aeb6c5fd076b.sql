-- Now create the missing folios and charges (triggers are fixed)
-- Create folio for room 117 reservation
INSERT INTO folios (
  tenant_id,
  reservation_id,
  folio_number,
  status
)
SELECT 
  r.tenant_id,
  r.id,
  'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(r.id::text, 6, '0'),
  'open'
FROM reservations r
WHERE r.id = '02ec6f8c-cd0a-4dce-a3a4-86dd1fa65712'
  AND NOT EXISTS (SELECT 1 FROM folios f WHERE f.reservation_id = r.id);

-- Create folio for room 131 second reservation
INSERT INTO folios (
  tenant_id,
  reservation_id,
  folio_number,
  status
)
SELECT 
  r.tenant_id,
  r.id,
  'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(r.id::text, 6, '0'),
  'open'
FROM reservations r
WHERE r.id = 'ff381cb1-0050-4b31-a783-65da7dbeb239'
  AND NOT EXISTS (SELECT 1 FROM folios f WHERE f.reservation_id = r.id);

-- Add room charges to newly created folios
INSERT INTO folio_charges (
  tenant_id,
  folio_id,
  charge_type,
  description,
  amount,
  posted_by
)
SELECT 
  f.tenant_id,
  f.id,
  'room',
  'Room charges for reservation ' || r.reservation_number,
  r.total_amount,
  get_user_id()
FROM folios f
JOIN reservations r ON r.id = f.reservation_id
WHERE r.id IN ('02ec6f8c-cd0a-4dce-a3a4-86dd1fa65712', 'ff381cb1-0050-4b31-a783-65da7dbeb239')
  AND NOT EXISTS (
    SELECT 1 FROM folio_charges fc 
    WHERE fc.folio_id = f.id AND fc.charge_type = 'room'
  );

-- Update the get_or_create_folio function
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
BEGIN
  -- Try to get existing open folio
  SELECT id INTO folio_id
  FROM folios 
  WHERE reservation_id = p_reservation_id 
    AND status = 'open'
  LIMIT 1;
  
  -- If no open folio exists, create one
  IF folio_id IS NULL THEN
    -- Get reservation total for initial charges
    SELECT total_amount INTO reservation_total
    FROM reservations
    WHERE id = p_reservation_id;
    
    folio_number := 'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(p_reservation_id::text, 6, '0');
    
    INSERT INTO folios (
      tenant_id,
      reservation_id,
      folio_number,
      status
    ) VALUES (
      p_tenant_id,
      p_reservation_id,
      folio_number,
      'open'
    ) RETURNING id INTO folio_id;
    
    -- Add initial room charge if reservation has an amount
    IF reservation_total > 0 THEN
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
  
  RETURN folio_id;
END;
$$;