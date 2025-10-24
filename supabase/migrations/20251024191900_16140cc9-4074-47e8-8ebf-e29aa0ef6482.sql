-- Phase 1: Fix create_unified_qr_request to use session_id correctly
-- CRITICAL FIX: The function was storing guest_sessions.id (primary key) 
-- instead of guest_sessions.session_id (business logic UUID)

DROP FUNCTION IF EXISTS public.create_unified_qr_request(uuid, text, jsonb, text);

CREATE OR REPLACE FUNCTION public.create_unified_qr_request(
  p_session_id uuid,
  p_request_type text,
  p_request_data jsonb,
  p_priority text DEFAULT 'normal'
)
RETURNS TABLE(request_id uuid, tracking_number text, created_at timestamptz, tenant_id uuid)
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_new_request_id uuid;
  v_tracking_number text;
BEGIN
  -- ✅ FIX: SELECT both id AND session_id from guest_sessions
  SELECT gs.id, gs.session_id, gs.tenant_id, gs.qr_code_id, gs.room_id, r.room_number
  INTO v_session
  FROM guest_sessions gs
  LEFT JOIN rooms r ON r.id = gs.room_id
  WHERE gs.session_id = p_session_id
    AND gs.is_active = true 
    AND gs.expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session: %', p_session_id;
  END IF;

  -- Generate tracking number
  v_tracking_number := 'QR-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

  -- ✅ CRITICAL FIX: Use v_session.session_id (business UUID) NOT v_session.id (primary key)
  INSERT INTO qr_requests (
    tenant_id, qr_code_id, session_id, request_type, request_data, 
    priority, room_id, status, tracking_number
  )
  VALUES (
    v_session.tenant_id, v_session.qr_code_id, v_session.session_id,
    p_request_type, p_request_data, p_priority, 
    v_session.room_id, 'pending', v_tracking_number
  )
  RETURNING id INTO v_new_request_id;

  -- Update session activity (use primary key for WHERE clause)
  UPDATE guest_sessions 
  SET request_count = request_count + 1, last_activity_at = now()
  WHERE id = v_session.id;

  RETURN QUERY SELECT v_new_request_id, v_tracking_number, now()::timestamptz, v_session.tenant_id;
END;
$$;

-- Phase 4: Add RLS policies for qr_requests table
ALTER TABLE qr_requests ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for edge functions)
DROP POLICY IF EXISTS "Service role can manage requests" ON qr_requests;
CREATE POLICY "Service role can manage requests"
ON qr_requests FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Guests can read their requests
DROP POLICY IF EXISTS "Guests can read their requests" ON qr_requests;
CREATE POLICY "Guests can read their requests"
ON qr_requests FOR SELECT TO anon, authenticated
USING (
  session_id IN (
    SELECT session_id FROM guest_sessions 
    WHERE is_active = true AND expires_at > now()
  )
);

-- Staff can manage tenant requests
DROP POLICY IF EXISTS "Staff can manage tenant requests" ON qr_requests;
CREATE POLICY "Staff can manage tenant requests"
ON qr_requests FOR ALL TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

COMMENT ON FUNCTION create_unified_qr_request IS 'Creates QR request using session_id (business UUID) not guest_sessions.id (primary key)';