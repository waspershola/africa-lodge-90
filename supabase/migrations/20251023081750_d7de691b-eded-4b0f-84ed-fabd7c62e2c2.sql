-- Task 4.1: Auto-reactivation on check-in
-- This trigger automatically reactivates QR codes when a guest checks in

CREATE OR REPLACE FUNCTION auto_reactivate_qr_on_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When reservation status changes to checked_in
  IF NEW.status = 'checked_in' AND (OLD.status IS NULL OR OLD.status != 'checked_in') THEN
    -- Reactivate the room's QR code
    UPDATE qr_codes
    SET 
      is_active = true,
      expires_at = NULL,
      updated_at = now()
    WHERE room_id = NEW.room_id;
    
    -- Log the reactivation
    INSERT INTO audit_log (tenant_id, action, resource_type, resource_id, metadata, actor_id)
    SELECT 
      qr.tenant_id,
      'qr_reactivated_on_checkin',
      'qr_code',
      qr.id,
      jsonb_build_object(
        'room_id', NEW.room_id,
        'guest_name', NEW.guest_name,
        'reservation_id', NEW.id,
        'check_in_date', NEW.check_in_date
      ),
      auth.uid()
    FROM qr_codes qr
    WHERE qr.room_id = NEW.room_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-reactivation
DROP TRIGGER IF EXISTS auto_reactivate_qr_on_checkin_trigger ON reservations;

CREATE TRIGGER auto_reactivate_qr_on_checkin_trigger
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION auto_reactivate_qr_on_checkin();

-- Task 4.2: QR Code Cleanup & Deduplication
-- Function to find and archive duplicate QR codes

CREATE OR REPLACE FUNCTION cleanup_duplicate_qr_codes()
RETURNS TABLE (
  room_id UUID,
  kept_qr_id UUID,
  archived_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH duplicates AS (
    -- Find rooms with multiple QR codes
    SELECT 
      qr.room_id as dup_room_id,
      array_agg(qr.id ORDER BY qr.created_at DESC) as qr_ids,
      count(*) as qr_count
    FROM qr_codes qr
    WHERE qr.room_id IS NOT NULL
    GROUP BY qr.room_id
    HAVING count(*) > 1
  ),
  kept_codes AS (
    -- Keep the most recent QR code for each room
    SELECT 
      dup_room_id,
      qr_ids[1] as keep_id,
      qr_ids[2:array_length(qr_ids, 1)] as archive_ids,
      array_length(qr_ids, 1) - 1 as archived_count
    FROM duplicates
  ),
  archived AS (
    -- Deactivate duplicate QR codes
    UPDATE qr_codes
    SET 
      is_active = false,
      expires_at = now(),
      updated_at = now()
    FROM kept_codes
    WHERE qr_codes.id = ANY(kept_codes.archive_ids)
    RETURNING qr_codes.id, qr_codes.room_id as archived_room_id
  ),
  logged AS (
    -- Log the cleanup action
    INSERT INTO audit_log (tenant_id, action, resource_type, resource_id, metadata)
    SELECT 
      qr.tenant_id,
      'qr_duplicate_archived',
      'qr_code',
      archived.id,
      jsonb_build_object(
        'room_id', archived.archived_room_id,
        'reason', 'duplicate_cleanup',
        'automated', true
      )
    FROM archived
    JOIN qr_codes qr ON qr.id = archived.id
    RETURNING resource_id
  )
  SELECT 
    kc.dup_room_id,
    kc.keep_id,
    kc.archived_count::INTEGER
  FROM kept_codes kc;
END;
$$;

-- Add unique constraint to prevent future duplicates
-- Note: This constraint only applies to active QR codes with room_id
DO $$ 
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_active_qr_per_room'
  ) THEN
    ALTER TABLE qr_codes DROP CONSTRAINT unique_active_qr_per_room;
  END IF;
  
  -- Add the constraint using EXCLUDE
  ALTER TABLE qr_codes
  ADD CONSTRAINT unique_active_qr_per_room 
  EXCLUDE (room_id WITH =) 
  WHERE (is_active = true AND room_id IS NOT NULL);
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists, ignore
END $$;

-- Run the cleanup function to fix existing duplicates
SELECT * FROM cleanup_duplicate_qr_codes();