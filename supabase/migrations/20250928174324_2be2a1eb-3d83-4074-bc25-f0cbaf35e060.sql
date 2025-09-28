-- Clean up duplicate reservations for Room 111 (keep only one active reservation per room)
-- This will cancel old overlapping reservations

UPDATE reservations 
SET status = 'cancelled', 
    updated_at = now()
WHERE room_id = 'c59101b5-f137-4c1c-894b-caa3124ab930'  -- Room 111
  AND status IN ('confirmed', 'reserved')
  AND id IN (
    '82628ead-3530-4e61-b136-4acbd3c408b4',  -- Old reservation
    '44f6905c-5ea9-461d-acca-7f6e99e533af',  -- Old reservation
    '28392e43-0046-4d9a-82f3-6d9143824b0f'   -- Old reservation
  );

-- Add constraint to prevent multiple active reservations per room
-- Only one active reservation allowed per room at a time
CREATE OR REPLACE FUNCTION prevent_multiple_active_reservations()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already an active reservation for this room
  IF NEW.status IN ('confirmed', 'reserved', 'checked_in') THEN
    IF EXISTS (
      SELECT 1 FROM reservations 
      WHERE room_id = NEW.room_id 
        AND status IN ('confirmed', 'reserved', 'checked_in')
        AND id != NEW.id
        AND (
          (NEW.check_in_date >= check_in_date AND NEW.check_in_date < check_out_date) OR
          (NEW.check_out_date > check_in_date AND NEW.check_out_date <= check_out_date) OR
          (NEW.check_in_date <= check_in_date AND NEW.check_out_date >= check_out_date)
        )
    ) THEN
      RAISE EXCEPTION 'Room already has an active reservation for the specified dates';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single active reservation per room
DROP TRIGGER IF EXISTS check_active_reservations ON reservations;
CREATE TRIGGER check_active_reservations
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_active_reservations();