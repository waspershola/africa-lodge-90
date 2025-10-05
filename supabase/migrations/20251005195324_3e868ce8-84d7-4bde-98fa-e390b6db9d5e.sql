-- ============================================
-- UNIFIED QR SYSTEM - CLEAN SCHEMA
-- Creating new unified tables without data migration
-- ============================================

-- STEP 1: Enhance qr_codes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'qr_type') THEN
    ALTER TABLE qr_codes ADD COLUMN qr_type text DEFAULT 'GUEST_PORTAL' CHECK (qr_type IN ('ROOM_ACCESS', 'GUEST_FOLIO', 'HOUSEKEEPING_TASK', 'RESTAURANT_MENU', 'PAYMENT_LINK', 'GUEST_PORTAL'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'target_id') THEN
    ALTER TABLE qr_codes ADD COLUMN target_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'expires_at') THEN
    ALTER TABLE qr_codes ADD COLUMN expires_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'last_scanned_at') THEN
    ALTER TABLE qr_codes ADD COLUMN last_scanned_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'scan_count') THEN
    ALTER TABLE qr_codes ADD COLUMN scan_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'metadata') THEN
    ALTER TABLE qr_codes ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

UPDATE qr_codes SET qr_type = 'GUEST_PORTAL' WHERE qr_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_type ON qr_codes(tenant_id, qr_type);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires ON qr_codes(expires_at) WHERE expires_at IS NOT NULL;

-- STEP 2: Create qr_scan_logs table
CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL,
  session_id uuid,
  scanned_by uuid,
  scan_type text NOT NULL CHECK (scan_type IN ('GUEST', 'STAFF', 'SYSTEM')),
  source_ip inet,
  device_info jsonb DEFAULT '{}'::jsonb,
  location_data jsonb DEFAULT '{}'::jsonb,
  scanned_at timestamptz DEFAULT now(),
  tenant_id uuid NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_scan_logs_qr_code_id_fkey') THEN
    ALTER TABLE qr_scan_logs ADD CONSTRAINT qr_scan_logs_qr_code_id_fkey 
      FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_scan_logs_session_id_fkey') THEN
    ALTER TABLE qr_scan_logs ADD CONSTRAINT qr_scan_logs_session_id_fkey 
      FOREIGN KEY (session_id) REFERENCES guest_sessions(session_id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_scan_logs_scanned_by_fkey') THEN
    ALTER TABLE qr_scan_logs ADD CONSTRAINT qr_scan_logs_scanned_by_fkey 
      FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_scan_logs_tenant_id_fkey') THEN
    ALTER TABLE qr_scan_logs ADD CONSTRAINT qr_scan_logs_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_qr_code ON qr_scan_logs(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_tenant ON qr_scan_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_scanned_at ON qr_scan_logs(scanned_at);

-- STEP 3: Create qr_requests table (new unified table)
CREATE TABLE IF NOT EXISTS qr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  qr_code_id uuid,
  session_id uuid,
  request_type text NOT NULL CHECK (request_type IN ('ROOM_SERVICE', 'HOUSEKEEPING', 'MAINTENANCE', 'CONCIERGE', 'SPA', 'LAUNDRY')),
  request_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid,
  room_id uuid,
  guest_name text,
  guest_phone text,
  guest_email text,
  notes text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_requests_tenant_id_fkey') THEN
    ALTER TABLE qr_requests ADD CONSTRAINT qr_requests_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_requests_qr_code_id_fkey') THEN
    ALTER TABLE qr_requests ADD CONSTRAINT qr_requests_qr_code_id_fkey 
      FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_requests_session_id_fkey') THEN
    ALTER TABLE qr_requests ADD CONSTRAINT qr_requests_session_id_fkey 
      FOREIGN KEY (session_id) REFERENCES guest_sessions(session_id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_requests_assigned_to_fkey') THEN
    ALTER TABLE qr_requests ADD CONSTRAINT qr_requests_assigned_to_fkey 
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_requests_room_id_fkey') THEN
    ALTER TABLE qr_requests ADD CONSTRAINT qr_requests_room_id_fkey 
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qr_requests_tenant ON qr_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_requests_status ON qr_requests(status);
CREATE INDEX IF NOT EXISTS idx_qr_requests_session ON qr_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_requests_room ON qr_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_qr_requests_assigned ON qr_requests(assigned_to);

-- STEP 4: Enhance qr_settings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_settings' AND column_name = 'session_lifetime_hours') THEN
    ALTER TABLE qr_settings ADD COLUMN session_lifetime_hours integer DEFAULT 24;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_settings' AND column_name = 'max_requests_per_session') THEN
    ALTER TABLE qr_settings ADD COLUMN max_requests_per_session integer DEFAULT 50;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_settings' AND column_name = 'rate_limit_per_minute') THEN
    ALTER TABLE qr_settings ADD COLUMN rate_limit_per_minute integer DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_settings' AND column_name = 'auto_expire_on_checkout') THEN
    ALTER TABLE qr_settings ADD COLUMN auto_expire_on_checkout boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_settings' AND column_name = 'require_guest_verification') THEN
    ALTER TABLE qr_settings ADD COLUMN require_guest_verification boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_settings' AND column_name = 'allowed_request_types') THEN
    ALTER TABLE qr_settings ADD COLUMN allowed_request_types text[] DEFAULT ARRAY['ROOM_SERVICE', 'HOUSEKEEPING', 'MAINTENANCE']::text[];
  END IF;
END $$;

-- STEP 5: Enable RLS
ALTER TABLE qr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view requests" ON qr_requests;
CREATE POLICY "Tenant staff can view requests" ON qr_requests 
  FOR SELECT USING (can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "Tenant staff can manage requests" ON qr_requests;
CREATE POLICY "Tenant staff can manage requests" ON qr_requests 
  FOR ALL USING (can_access_tenant(tenant_id) AND (get_user_role() = ANY (ARRAY['OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE'])));

DROP POLICY IF EXISTS "Service role can create guest requests" ON qr_requests;
CREATE POLICY "Service role can create guest requests" ON qr_requests 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant staff can view scan logs" ON qr_scan_logs;
CREATE POLICY "Tenant staff can view scan logs" ON qr_scan_logs 
  FOR SELECT USING (can_access_tenant(tenant_id));

DROP POLICY IF EXISTS "System can insert scan logs" ON qr_scan_logs;
CREATE POLICY "System can insert scan logs" ON qr_scan_logs 
  FOR INSERT WITH CHECK (true);

-- STEP 6: Create database functions
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
BEGIN
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

  UPDATE qr_codes SET scan_count = scan_count + 1, last_scanned_at = now() WHERE id = v_qr_record.id;

  v_session_expires := now() + (v_qr_record.session_lifetime_hours || ' hours')::interval;
  
  INSERT INTO guest_sessions (session_id, tenant_id, qr_code_id, room_id, expires_at, device_info, is_active)
  VALUES (gen_random_uuid(), v_qr_record.tenant_id, v_qr_record.id, v_qr_record.room_id, v_session_expires, p_device_info, true)
  RETURNING guest_sessions.session_id INTO v_new_session_id;

  INSERT INTO qr_scan_logs (qr_code_id, session_id, scan_type, device_info, tenant_id)
  VALUES (v_qr_record.id, v_new_session_id, 'GUEST', p_device_info, v_qr_record.tenant_id);

  RETURN QUERY
  SELECT true, v_new_session_id, v_qr_record.id, v_qr_record.tenant_id, v_qr_record.hotel_name,
         v_qr_record.services, COALESCE(r.room_number, '')::text, v_session_expires
  FROM rooms r WHERE r.id = v_qr_record.room_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_unified_qr_request(
  p_session_id uuid, p_request_type text, p_request_data jsonb, p_priority text DEFAULT 'normal'
)
RETURNS TABLE(request_id uuid, tracking_number text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_new_request_id uuid;
  v_tracking_number text;
BEGIN
  SELECT gs.tenant_id, gs.qr_code_id, gs.room_id, r.room_number
  INTO v_session
  FROM guest_sessions gs
  LEFT JOIN rooms r ON r.id = gs.room_id
  WHERE gs.session_id = p_session_id AND gs.is_active = true AND gs.expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;

  v_tracking_number := 'QR-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

  INSERT INTO qr_requests (tenant_id, qr_code_id, session_id, request_type, request_data, priority, room_id, status)
  VALUES (v_session.tenant_id, v_session.qr_code_id, p_session_id, p_request_type, p_request_data, p_priority, v_session.room_id, 'pending')
  RETURNING id INTO v_new_request_id;

  UPDATE guest_sessions SET request_count = request_count + 1, last_activity_at = now()
  WHERE session_id = p_session_id;

  RETURN QUERY SELECT v_new_request_id, v_tracking_number, now();
END;
$$;

-- STEP 7: Create auto-expire trigger
CREATE OR REPLACE FUNCTION auto_expire_qr_on_checkout()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    UPDATE qr_codes SET is_active = false, expires_at = now()
    WHERE room_id = NEW.room_id AND tenant_id = NEW.tenant_id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_expire_qr_on_checkout ON reservations;
CREATE TRIGGER trigger_auto_expire_qr_on_checkout
  AFTER UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION auto_expire_qr_on_checkout();

-- Add comments
COMMENT ON TABLE qr_requests IS 'Unified QR service requests from guests';
COMMENT ON TABLE qr_scan_logs IS 'Audit log of all QR code scans';
COMMENT ON FUNCTION validate_qr_and_create_session IS 'Validates QR token and creates guest session';
COMMENT ON FUNCTION create_unified_qr_request IS 'Creates a service request from a guest session';