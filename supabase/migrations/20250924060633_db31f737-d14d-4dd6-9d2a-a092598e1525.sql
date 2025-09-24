-- CRITICAL SECURITY FIX: Remove public access to QR codes table
-- This prevents unauthorized access to internal QR code data

-- Drop the dangerous public policy
DROP POLICY IF EXISTS "Public can view active QR codes" ON public.qr_codes;

-- Create a secure function for public QR validation that only exposes necessary data
CREATE OR REPLACE FUNCTION public.validate_qr_token_public(token_input text)
RETURNS TABLE(
  is_valid boolean,
  hotel_name text,
  location_type text,
  services text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  qr_record RECORD;
BEGIN
  -- Find QR code by token with minimal data exposure
  SELECT 
    qr.is_active,
    qr.services,
    qr.scan_type as location_type,
    qs.hotel_name
  INTO qr_record
  FROM qr_codes qr
  JOIN qr_settings qs ON qs.tenant_id = qr.tenant_id
  WHERE qr.qr_token = token_input 
    AND qr.is_active = true;

  -- Return validation result with minimal safe data
  IF FOUND THEN
    RETURN QUERY SELECT 
      true as is_valid,
      qr_record.hotel_name,
      qr_record.location_type,
      qr_record.services;
  ELSE
    RETURN QUERY SELECT 
      false as is_valid,
      ''::text as hotel_name,
      ''::text as location_type,
      ARRAY[]::text[] as services;
  END IF;
END;
$$;

-- Add audit log entry for this critical security fix
INSERT INTO public.audit_log (
  actor_id,
  actor_email,
  action,
  resource_type,
  description,
  metadata
) VALUES (
  auth.uid(),
  COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'system'),
  'CRITICAL_SECURITY_FIX',
  'RLS_POLICY',
  'Removed dangerous public access to qr_codes table and created secure validation function',
  jsonb_build_object(
    'vulnerability', 'public_data_exposure',
    'table_affected', 'qr_codes',
    'severity', 'CRITICAL',
    'fix_applied', now(),
    'secure_function_created', 'validate_qr_token_public'
  )
);