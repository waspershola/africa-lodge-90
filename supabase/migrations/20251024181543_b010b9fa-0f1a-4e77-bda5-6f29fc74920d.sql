-- Fix Function Search Path Mutable warnings - Safe functions only
-- Only update functions that don't have overloads

-- cleanup_old_sessions (no overloads)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM guest_sessions
  WHERE created_at < now() - interval '7 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$function$;

-- expire_stale_sessions (no overloads)
CREATE OR REPLACE FUNCTION public.expire_stale_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE guest_sessions
  SET is_active = false, updated_at = now()
  WHERE is_active = true
    AND expires_at <= now();
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$function$;

-- update_qr_analytics (trigger function, no overloads)
CREATE OR REPLACE FUNCTION public.update_qr_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO qr_analytics (tenant_id, qr_code_id, request_count, last_scanned_at, period)
        VALUES (
            NEW.tenant_id,
            NEW.qr_code_id,
            1,
            now(),
            CURRENT_DATE
        )
        ON CONFLICT (tenant_id, qr_code_id, period)
        DO UPDATE SET
            request_count = qr_analytics.request_count + 1,
            last_scanned_at = now();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- normalize_request_type (trigger function, no overloads)
CREATE OR REPLACE FUNCTION public.normalize_request_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.request_type := UPPER(NEW.request_type);
  RETURN NEW;
END;
$function$;

-- Add comments
COMMENT ON FUNCTION cleanup_old_sessions IS 'Cleanup old guest sessions - SECURITY: SET search_path';
COMMENT ON FUNCTION expire_stale_sessions IS 'Mark expired sessions as inactive - SECURITY: SET search_path';
COMMENT ON FUNCTION update_qr_analytics IS 'Update QR analytics on request creation - SECURITY: SET search_path';
COMMENT ON FUNCTION normalize_request_type IS 'Normalize request type to uppercase - SECURITY: SET search_path';