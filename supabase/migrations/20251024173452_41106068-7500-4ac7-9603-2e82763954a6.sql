-- Fix ambiguous column reference in validate_qr_and_create_session
-- Must DROP and recreate to change return type

DROP FUNCTION IF EXISTS public.validate_qr_and_create_session(text, jsonb);

CREATE OR REPLACE FUNCTION public.validate_qr_and_create_session(p_qr_token text, p_device_info jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(is_valid boolean, guest_session_id uuid, qr_code_id uuid, tenant_id uuid, hotel_name text, services text[], room_number text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_qr_record RECORD;
  v_new_session_id uuid;
  v_new_pk_id uuid;
  v_existing_session RECORD;
  v_session_expires timestamptz;
  v_room_number text;
  v_device_fingerprint text;
  v_should_create_new boolean := true;
BEGIN
  -- Extract device fingerprint from device_info (client-side generated hash)
  v_device_fingerprint := COALESCE(p_device_info->>'fingerprint', 'unknown');
  
  -- Log the incoming request
  RAISE NOTICE '🔍 [Session Management] QR Token: %, Device: %', 
    LEFT(p_qr_token, 20), LEFT(v_device_fingerprint, 10);

  -- Fetch QR code and settings
  SELECT qr.id, qr.tenant_id, qr.services, qr.room_id, qr.is_active, qr.expires_at,
         qs.hotel_name, qs.session_lifetime_hours
  INTO v_qr_record
  FROM qr_codes qr
  JOIN qr_settings qs ON qs.tenant_id = qr.tenant_id
  WHERE qr.qr_token = p_qr_token AND qr.is_active = true
    AND (qr.expires_at IS NULL OR qr.expires_at > now());

  IF NOT FOUND THEN
    RAISE NOTICE '❌ [Session Management] Invalid or expired QR code';
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, NULL::uuid, ''::text, ARRAY[]::text[], ''::text, NULL::timestamptz;
    RETURN;
  END IF;

  -- Check for existing active sessions for this QR code
  SELECT gs.id, gs.session_id, gs.device_fingerprint, gs.expires_at
  INTO v_existing_session
  FROM guest_sessions gs
  WHERE gs.qr_code_id = v_qr_record.id
    AND gs.is_active = true
    AND gs.expires_at > now()
  ORDER BY gs.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RAISE NOTICE '🔍 [Session Management] Found existing session: %, Device: %', 
      v_existing_session.session_id, LEFT(COALESCE(v_existing_session.device_fingerprint, 'none'), 10);
    
    -- Check if it's the SAME device
    IF COALESCE(v_existing_session.device_fingerprint, 'none') = v_device_fingerprint THEN
      RAISE NOTICE '✅ [Session Management] SAME device detected - RESUMING session';
      v_should_create_new := false;
      v_new_session_id := v_existing_session.session_id;
      v_session_expires := v_existing_session.expires_at;
      
      -- Update last activity and device info
      UPDATE guest_sessions 
      SET device_info = p_device_info,
          last_activity_at = now()
      WHERE session_id = v_new_session_id;
      
      -- Audit log: Session resumed
      INSERT INTO qr_session_audit (
        qr_code_id, guest_session_uuid, event_type, device_fingerprint, 
        device_info, reason, tenant_id
      ) VALUES (
        v_qr_record.id, v_existing_session.id, 'session_resumed',
        v_device_fingerprint, p_device_info,
        'Same device rescanned QR code', v_qr_record.tenant_id
      );
      
    ELSE
      RAISE NOTICE '⚠️ [Session Management] DIFFERENT device detected - INVALIDATING old session';
      
      -- Invalidate old session (different device)
      UPDATE guest_sessions 
      SET is_active = false,
          last_activity_at = now()
      WHERE session_id = v_existing_session.session_id;
      
      -- Audit log: Session invalidated
      INSERT INTO qr_session_audit (
        qr_code_id, guest_session_uuid, event_type, device_fingerprint,
        device_info, reason, tenant_id
      ) VALUES (
        v_qr_record.id, v_existing_session.id, 'session_invalidated',
        v_device_fingerprint, p_device_info,
        'Different device scanned same QR code', v_qr_record.tenant_id
      );
      
      v_should_create_new := true;
    END IF;
  ELSE
    RAISE NOTICE '🆕 [Session Management] No existing session - creating new one';
  END IF;

  -- Create new session if needed
  IF v_should_create_new THEN
    -- Update scan stats
    UPDATE qr_codes 
    SET scan_count = scan_count + 1, 
        last_scanned_at = now() 
    WHERE id = v_qr_record.id;

    -- Calculate session expiration
    v_session_expires := now() + (v_qr_record.session_lifetime_hours || ' hours')::interval;
    
    -- Create new guest session with device fingerprint
    INSERT INTO guest_sessions (
      session_id, tenant_id, qr_code_id, room_id, expires_at, 
      device_info, device_fingerprint, is_active, created_at, last_activity_at
    )
    VALUES (
      gen_random_uuid(), v_qr_record.tenant_id, v_qr_record.id, 
      v_qr_record.room_id, v_session_expires, p_device_info, 
      v_device_fingerprint, true, now(), now()
    )
    RETURNING id, session_id INTO v_new_pk_id, v_new_session_id;

    -- Log scan
    INSERT INTO qr_scan_logs (
      qr_code_id, session_id, scan_type, device_info, tenant_id
    )
    VALUES (
      v_qr_record.id, v_new_session_id, 'GUEST', p_device_info, v_qr_record.tenant_id
    );
    
    -- Audit log: Session created
    INSERT INTO qr_session_audit (
      qr_code_id, 
      guest_session_uuid, 
      event_type, 
      device_fingerprint,
      device_info, 
      reason, 
      tenant_id
    ) VALUES (
      v_qr_record.id,
      v_new_pk_id,
      'session_created',
      v_device_fingerprint,
      p_device_info,
      'New device scanned QR code',
      v_qr_record.tenant_id
    );

    RAISE NOTICE '✅ [Session Management] New session created: %', v_new_session_id;
  END IF;

  -- Get room number only if room_id exists
  IF v_qr_record.room_id IS NOT NULL THEN
    SELECT r.room_number INTO v_room_number FROM rooms r WHERE r.id = v_qr_record.room_id;
  ELSE
    v_room_number := '';
  END IF;

  -- Return session data (always returns exactly 1 row)
  RETURN QUERY
  SELECT true, v_new_session_id, v_qr_record.id, v_qr_record.tenant_id, 
         v_qr_record.hotel_name, v_qr_record.services, 
         COALESCE(v_room_number, '')::text, v_session_expires;
END;
$function$;