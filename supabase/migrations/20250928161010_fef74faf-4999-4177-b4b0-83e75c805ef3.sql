-- Create database trigger to automatically update room status when reservations are cancelled
-- This ensures room status stays in sync with reservation status changes

-- Function to update room status based on reservation changes
CREATE OR REPLACE FUNCTION update_room_status_on_reservation_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining_active_reservations INTEGER;
  room_record RECORD;
BEGIN
  -- Only process if reservation status changed and room_id exists
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.room_id IS NOT NULL) OR
     (TG_OP = 'INSERT' AND NEW.room_id IS NOT NULL) THEN
    
    -- Get room details
    SELECT * INTO room_record FROM rooms WHERE id = NEW.room_id;
    
    -- Handle cancellation: check if room should become available
    IF NEW.status = 'cancelled' THEN
      -- Count remaining active reservations for this room
      SELECT COUNT(*) INTO remaining_active_reservations
      FROM reservations 
      WHERE room_id = NEW.room_id 
        AND status IN ('confirmed', 'checked_in') 
        AND tenant_id = NEW.tenant_id;
      
      -- If no active reservations remain and room is not dirty/maintenance, make it available
      IF remaining_active_reservations = 0 AND room_record.status NOT IN ('dirty', 'maintenance', 'out_of_service') THEN
        UPDATE rooms 
        SET status = 'available', updated_at = now() 
        WHERE id = NEW.room_id;
        
        -- Log the automatic status change
        INSERT INTO audit_log (
          action, resource_type, resource_id, actor_id, tenant_id, description, metadata
        ) VALUES (
          'ROOM_STATUS_AUTO_UPDATE',
          'ROOM', 
          NEW.room_id,
          auth.uid(),
          NEW.tenant_id,
          'Room automatically set to available after reservation cancellation',
          jsonb_build_object(
            'reservation_id', NEW.id,
            'trigger', 'reservation_cancelled',
            'old_room_status', room_record.status,
            'new_room_status', 'available'
          )
        );
      END IF;
      
    -- Handle confirmation: update room to reserved if currently available
    ELSIF NEW.status = 'confirmed' AND room_record.status = 'available' THEN
      UPDATE rooms 
      SET status = 'reserved', updated_at = now() 
      WHERE id = NEW.room_id;
      
    -- Handle check-in: update room to occupied
    ELSIF NEW.status = 'checked_in' AND room_record.status IN ('reserved', 'available') THEN
      UPDATE rooms 
      SET status = 'occupied', updated_at = now() 
      WHERE id = NEW.room_id;
      
    -- Handle check-out: update room to dirty for housekeeping
    ELSIF NEW.status = 'checked_out' AND room_record.status = 'occupied' THEN
      UPDATE rooms 
      SET status = 'dirty', updated_at = now() 
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for reservation updates
DROP TRIGGER IF EXISTS trigger_update_room_status_on_reservation_change ON reservations;
CREATE TRIGGER trigger_update_room_status_on_reservation_change
  AFTER INSERT OR UPDATE OF status ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_on_reservation_change();

-- Create validation function to prevent cancelling checked-in guests
CREATE OR REPLACE FUNCTION validate_reservation_cancellation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent cancelling already checked-in reservations without explicit checkout
  IF NEW.status = 'cancelled' AND OLD.status = 'checked_in' THEN
    RAISE EXCEPTION 'Cannot cancel a checked-in reservation. Please check out the guest first.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
DROP TRIGGER IF EXISTS trigger_validate_reservation_cancellation ON reservations;
CREATE TRIGGER trigger_validate_reservation_cancellation
  BEFORE UPDATE OF status ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION validate_reservation_cancellation();