-- Phase 1: Immediate Data Cleanup
-- Fix duplicate folios by closing all but the most recent one for each reservation

-- First, identify and close duplicate folios
WITH duplicate_folios AS (
  SELECT 
    f.id,
    f.reservation_id,
    f.created_at,
    ROW_NUMBER() OVER (PARTITION BY f.reservation_id ORDER BY f.created_at DESC) as rn
  FROM folios f
  WHERE f.status = 'open'
),
folios_to_close AS (
  SELECT id 
  FROM duplicate_folios 
  WHERE rn > 1
)
UPDATE folios 
SET 
  status = 'closed',
  closed_at = now(),
  closed_by = get_user_id()
WHERE id IN (SELECT id FROM folios_to_close);

-- Create function to safely get or create folio
CREATE OR REPLACE FUNCTION get_or_create_folio(p_reservation_id UUID, p_tenant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  folio_id UUID;
  folio_number TEXT;
BEGIN
  -- Try to get existing open folio
  SELECT id INTO folio_id
  FROM folios 
  WHERE reservation_id = p_reservation_id 
    AND status = 'open'
  LIMIT 1;
  
  -- If no open folio exists, create one
  IF folio_id IS NULL THEN
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
  END IF;
  
  RETURN folio_id;
END;
$$;

-- Create function to safely handle multiple folios scenario
CREATE OR REPLACE FUNCTION handle_multiple_folios(p_reservation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  folio_id UUID;
  folio_count INTEGER;
BEGIN
  -- Count open folios for this reservation
  SELECT COUNT(*) INTO folio_count
  FROM folios 
  WHERE reservation_id = p_reservation_id 
    AND status = 'open';
  
  IF folio_count = 0 THEN
    RETURN NULL;
  ELSIF folio_count = 1 THEN
    -- Normal case - return the single folio
    SELECT id INTO folio_id
    FROM folios 
    WHERE reservation_id = p_reservation_id 
      AND status = 'open';
    RETURN folio_id;
  ELSE
    -- Multiple folios - close all but the most recent one
    WITH ranked_folios AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
      FROM folios 
      WHERE reservation_id = p_reservation_id 
        AND status = 'open'
    )
    UPDATE folios 
    SET 
      status = 'closed',
      closed_at = now(),
      closed_by = get_user_id()
    WHERE id IN (
      SELECT id FROM ranked_folios WHERE rn > 1
    );
    
    -- Return the most recent folio
    SELECT id INTO folio_id
    FROM folios 
    WHERE reservation_id = p_reservation_id 
      AND status = 'open'
    LIMIT 1;
    
    RETURN folio_id;
  END IF;
END;
$$;