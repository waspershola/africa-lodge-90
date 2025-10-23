-- Fix session ID handling in create_unified_qr_request RPC
-- This migration fixes the session_id mismatch causing requests to have NULL session_id

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_unified_qr_request(uuid, text, jsonb, text);

-- Recreate function with proper session handling
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
  -- Look up session using session_id (text UUID cast to uuid) and get the id (UUID primary key)
  SELECT gs.id, gs.tenant_id, gs.qr_code_id, gs.room_id, r.room_number
  INTO v_session
  FROM guest_sessions gs
  LEFT JOIN rooms r ON r.id = gs.room_id
  WHERE gs.session_id = p_session_id::text 
    AND gs.is_active = true 
    AND gs.expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session: %', p_session_id;
  END IF;

  -- Generate tracking number
  v_tracking_number := 'QR-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

  -- INSERT using guest_sessions.id (UUID primary key) for session_id foreign key
  INSERT INTO qr_requests (
    tenant_id, 
    qr_code_id, 
    session_id,
    request_type, 
    request_data, 
    priority, 
    room_id, 
    status,
    tracking_number
  )
  VALUES (
    v_session.tenant_id, 
    v_session.qr_code_id, 
    v_session.id,
    p_request_type, 
    p_request_data, 
    p_priority, 
    v_session.room_id, 
    'pending',
    v_tracking_number
  )
  RETURNING id INTO v_new_request_id;

  -- Update session activity using id (UUID PK)
  UPDATE guest_sessions 
  SET request_count = request_count + 1, 
      last_activity_at = now()
  WHERE id = v_session.id;

  -- Return the new request details
  RETURN QUERY SELECT 
    v_new_request_id, 
    v_tracking_number, 
    now()::timestamptz, 
    v_session.tenant_id;
END;
$$;

-- Backfill NULL session_id values in qr_requests
UPDATE qr_requests qr
SET session_id = gs.id
FROM guest_sessions gs
WHERE qr.session_id IS NULL
  AND gs.qr_code_id = qr.qr_code_id
  AND gs.created_at <= qr.created_at
  AND gs.expires_at >= qr.created_at
  AND gs.tenant_id = qr.tenant_id;

-- Add index to improve session lookup performance
CREATE INDEX IF NOT EXISTS idx_guest_sessions_session_id_lookup 
ON guest_sessions(session_id, is_active);

-- Log the migration
INSERT INTO public.audit_log (
  action,
  resource_type,
  description,
  metadata,
  created_at
) VALUES (
  'MIGRATION_APPLIED',
  'DATABASE',
  'Fixed session_id handling in create_unified_qr_request RPC and backfilled NULL values',
  jsonb_build_object(
    'migration_name', 'fix_session_id_handling',
    'tables_affected', ARRAY['qr_requests', 'guest_sessions'],
    'functions_updated', ARRAY['create_unified_qr_request']
  ),
  now()
);