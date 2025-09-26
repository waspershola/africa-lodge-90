-- Drop existing function and recreate with label field
DROP FUNCTION IF EXISTS public.validate_qr_token_public(text);

CREATE OR REPLACE FUNCTION public.validate_qr_token_public(token_input text)
RETURNS TABLE(is_valid boolean, hotel_name text, location_type text, services text[], tenant_id uuid, room_id uuid, label text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  qr_record RECORD;
BEGIN
  -- Find QR code by token with minimal data exposure
  SELECT 
    qr.is_active,
    qr.services,
    qr.scan_type as location_type,
    qr.tenant_id,
    qr.room_id,
    qr.label,
    qs.hotel_name
  INTO qr_record
  FROM qr_codes qr
  JOIN qr_settings qs ON qs.tenant_id = qr.tenant_id
  WHERE qr.qr_token = token_input 
    AND qr.is_active = true;

  -- Return validation result with minimal safe data including label
  IF FOUND THEN
    RETURN QUERY SELECT 
      true as is_valid,
      qr_record.hotel_name,
      qr_record.location_type,
      qr_record.services,
      qr_record.tenant_id,
      qr_record.room_id,
      qr_record.label;
  ELSE
    RETURN QUERY SELECT 
      false as is_valid,
      ''::text as hotel_name,
      ''::text as location_type,
      ARRAY[]::text[] as services,
      NULL::uuid as tenant_id,
      NULL::uuid as room_id,
      ''::text as label;
  END IF;
END;
$function$;