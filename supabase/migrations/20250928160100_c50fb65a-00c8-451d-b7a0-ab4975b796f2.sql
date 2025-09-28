-- Fix security warnings by adding proper search_path to trigger functions

CREATE OR REPLACE FUNCTION prevent_duplicate_checkins()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION prevent_duplicate_checkins_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;