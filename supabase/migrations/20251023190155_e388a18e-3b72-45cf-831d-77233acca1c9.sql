-- Fix create_unified_qr_request RPC function by removing invalid type cast
-- Issue: Line with WHERE gs.session_id = p_session_id::text causes "operator does not exist: uuid = text" error
-- Fix: Remove ::text cast since both sides are already uuid type

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
  -- Look up session using session_id (UUID to UUID comparison - NO CAST NEEDED)
  SELECT gs.id, gs.tenant_id, gs.qr_code_id, gs.room_id, r.room_number
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

  -- INSERT using guest_sessions.id (UUID primary key) for session_id foreign key
  INSERT INTO qr_requests (
    tenant_id, qr_code_id, session_id, request_type, request_data, 
    priority, room_id, status, tracking_number
  )
  VALUES (
    v_session.tenant_id, v_session.qr_code_id, v_session.id,
    p_request_type, p_request_data, p_priority, 
    v_session.room_id, 'pending', v_tracking_number
  )
  RETURNING id INTO v_new_request_id;

  -- Update session activity
  UPDATE guest_sessions 
  SET request_count = request_count + 1, last_activity_at = now()
  WHERE id = v_session.id;

  RETURN QUERY SELECT v_new_request_id, v_tracking_number, now()::timestamptz, v_session.tenant_id;
END;
$$;