-- Fix infinite loop in checkout by cleaning up duplicate reservations and preventing future conflicts

-- First, clean up the specific issue with room 131
-- Check out the older reservation to resolve the conflict
UPDATE reservations 
SET 
  status = 'checked_out',
  checked_out_at = now(),
  checked_out_by = get_user_id()
WHERE room_id IN (
  SELECT r.id FROM rooms r WHERE r.room_number = '131'
) 
AND status = 'checked_in'
AND id = 'a8fc7ac3-b70e-4c0f-8607-b2f2ce29fab5';

-- Close the associated folio for the older reservation
UPDATE folios 
SET 
  status = 'closed',
  closed_at = now(),
  closed_by = get_user_id()
WHERE id = '40530ab6-2256-4ff9-8835-991bbd248c15';

-- Add audit log for the cleanup
INSERT INTO audit_log (
  action,
  resource_type,
  resource_id,
  actor_id,
  tenant_id,
  description,
  metadata
) VALUES (
  'DUPLICATE_RESERVATION_CLEANUP',
  'RESERVATION',
  'a8fc7ac3-b70e-4c0f-8607-b2f2ce29fab5',
  get_user_id(),
  get_user_tenant_id(),
  'Automatically checked out duplicate reservation to resolve checkout conflicts',
  jsonb_build_object(
    'room_number', '131',
    'reason', 'duplicate_checked_in_reservations',
    'action_type', 'automated_cleanup'
  )
);

-- Create function to prevent multiple checked-in reservations for the same room
CREATE OR REPLACE FUNCTION prevent_duplicate_checkins()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply this check when updating status to 'checked_in'
  IF NEW.status = 'checked_in' AND (OLD.status IS NULL OR OLD.status != 'checked_in') THEN
    -- Check if there's already a checked-in reservation for this room
    IF EXISTS (
      SELECT 1 FROM reservations 
      WHERE room_id = NEW.room_id 
        AND status = 'checked_in' 
        AND id != NEW.id
        AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Room % already has a checked-in guest. Please check out the current guest first.', 
        (SELECT room_number FROM rooms WHERE id = NEW.room_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single checked-in reservation per room
DROP TRIGGER IF EXISTS prevent_duplicate_checkins_trigger ON reservations;
CREATE TRIGGER prevent_duplicate_checkins_trigger
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_checkins();

-- Also prevent duplicate checkins during INSERT
CREATE OR REPLACE FUNCTION prevent_duplicate_checkins_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply this check when inserting with status 'checked_in'
  IF NEW.status = 'checked_in' THEN
    -- Check if there's already a checked-in reservation for this room
    IF EXISTS (
      SELECT 1 FROM reservations 
      WHERE room_id = NEW.room_id 
        AND status = 'checked_in' 
        AND tenant_id = NEW.tenant_id
    ) THEN
      RAISE EXCEPTION 'Room % already has a checked-in guest. Please check out the current guest first.', 
        (SELECT room_number FROM rooms WHERE id = NEW.room_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS prevent_duplicate_checkins_insert_trigger ON reservations;
CREATE TRIGGER prevent_duplicate_checkins_insert_trigger
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_checkins_insert();