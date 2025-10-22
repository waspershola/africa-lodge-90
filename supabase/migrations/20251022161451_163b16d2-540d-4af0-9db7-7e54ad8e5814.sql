-- Fix Location QR Code Validation
-- Issue: validate_qr_and_create_session returns empty result for location QR codes (room_id = NULL)
-- Solution: Handle NULL room_id properly without querying rooms table

CREATE OR REPLACE FUNCTION validate_qr_and_create_session(
  p_qr_token text,
  p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  is_valid boolean, session_id uuid, qr_code_id uuid, tenant_id uuid,
  hotel_name text, services text[], room_number text, expires_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_qr_record RECORD;
  v_new_session_id uuid;
  v_session_expires timestamptz;
  v_room_number text;
BEGIN
  -- Fetch QR code and settings
  SELECT qr.id, qr.tenant_id, qr.services, qr.room_id, qr.is_active, qr.expires_at,
         qs.hotel_name, qs.session_lifetime_hours
  INTO v_qr_record
  FROM qr_codes qr
  JOIN qr_settings qs ON qs.tenant_id = qr.tenant_id
  WHERE qr.qr_token = p_qr_token AND qr.is_active = true
    AND (qr.expires_at IS NULL OR qr.expires_at > now());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, ''::text, ARRAY[]::text[], ''::text, NULL::timestamptz;
    RETURN;
  END IF;

  -- Update scan stats
  UPDATE qr_codes SET scan_count = scan_count + 1, last_scanned_at = now() WHERE id = v_qr_record.id;

  -- Calculate session expiration
  v_session_expires := now() + (v_qr_record.session_lifetime_hours || ' hours')::interval;
  
  -- Create guest session
  INSERT INTO guest_sessions (session_id, tenant_id, qr_code_id, room_id, expires_at, device_info, is_active)
  VALUES (gen_random_uuid(), v_qr_record.tenant_id, v_qr_record.id, v_qr_record.room_id, v_session_expires, p_device_info, true)
  RETURNING guest_sessions.session_id INTO v_new_session_id;

  -- Log scan
  INSERT INTO qr_scan_logs (qr_code_id, session_id, scan_type, device_info, tenant_id)
  VALUES (v_qr_record.id, v_new_session_id, 'GUEST', p_device_info, v_qr_record.tenant_id);

  -- Get room number only if room_id exists
  IF v_qr_record.room_id IS NOT NULL THEN
    SELECT r.room_number INTO v_room_number FROM rooms r WHERE r.id = v_qr_record.room_id;
  ELSE
    v_room_number := '';
  END IF;

  -- Return session data (always returns exactly 1 row)
  RETURN QUERY
  SELECT true, v_new_session_id, v_qr_record.id, v_qr_record.tenant_id, v_qr_record.hotel_name,
         v_qr_record.services, COALESCE(v_room_number, '')::text, v_session_expires;
END;
$$;

COMMENT ON FUNCTION validate_qr_and_create_session IS 'Validates QR token and creates guest session - handles both room and location QR codes';

-- Fix Service Name Case Mismatch
-- Issue: Frontend sends lowercase service names but database constraint requires uppercase
-- Solution: Make constraint case-insensitive and auto-normalize to uppercase

-- Drop old constraint
ALTER TABLE qr_requests DROP CONSTRAINT IF EXISTS qr_requests_request_type_check;

-- Add new case-insensitive constraint
ALTER TABLE qr_requests ADD CONSTRAINT qr_requests_request_type_check 
CHECK (UPPER(request_type) IN ('ROOM_SERVICE', 'HOUSEKEEPING', 'MAINTENANCE', 'CONCIERGE', 'SPA', 'LAUNDRY', 'WIFI', 'DIGITAL_MENU', 'EVENTS', 'FEEDBACK'));

-- Create function to normalize request types to uppercase
CREATE OR REPLACE FUNCTION normalize_request_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.request_type := UPPER(NEW.request_type);
  RETURN NEW;
END;
$$;

-- Add trigger to auto-uppercase request_type before insert/update
DROP TRIGGER IF EXISTS trigger_normalize_request_type ON qr_requests;
CREATE TRIGGER trigger_normalize_request_type
  BEFORE INSERT OR UPDATE ON qr_requests
  FOR EACH ROW EXECUTE FUNCTION normalize_request_type();

COMMENT ON FUNCTION normalize_request_type IS 'Automatically converts request_type to uppercase for consistency';
COMMENT ON TRIGGER trigger_normalize_request_type ON qr_requests IS 'Ensures all request types are stored in uppercase';

-- Fix QR Code Delete/Update Foreign Key Constraints
-- Issue: Cannot delete QR codes when active sessions/requests exist
-- Solution: Add ON DELETE CASCADE to allow clean deletion

DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  -- Update qr_requests foreign key to cascade delete
  SELECT EXISTS(
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'qr_requests_qr_code_id_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    ALTER TABLE qr_requests DROP CONSTRAINT qr_requests_qr_code_id_fkey;
    ALTER TABLE qr_requests ADD CONSTRAINT qr_requests_qr_code_id_fkey
      FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;
  END IF;
  
  -- Update qr_scan_logs foreign key to cascade delete
  SELECT EXISTS(
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'qr_scan_logs_qr_code_id_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    ALTER TABLE qr_scan_logs DROP CONSTRAINT qr_scan_logs_qr_code_id_fkey;
    ALTER TABLE qr_scan_logs ADD CONSTRAINT qr_scan_logs_qr_code_id_fkey
      FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;
  END IF;
  
  -- Update guest_sessions foreign key to cascade delete
  SELECT EXISTS(
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'guest_sessions_qr_code_id_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    ALTER TABLE guest_sessions DROP CONSTRAINT guest_sessions_qr_code_id_fkey;
    ALTER TABLE guest_sessions ADD CONSTRAINT guest_sessions_qr_code_id_fkey
      FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE qr_codes IS 'QR codes - can be safely deleted, cascades to related sessions, requests, and logs';