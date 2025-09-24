-- Fix critical security vulnerability: Secure QR settings table
-- Remove dangerous public read policy from qr_settings table
DROP POLICY IF EXISTS "Public can read QR settings for guest services" ON public.qr_settings;

-- Create secure policy for authenticated users only
CREATE POLICY "qr_settings_secure_access" ON public.qr_settings
  FOR ALL
  TO authenticated
  USING (can_access_tenant(tenant_id));

-- Create a secure function to provide minimal QR portal info for public access
-- This replaces the dangerous public policy with controlled data exposure
CREATE OR REPLACE FUNCTION public.get_qr_portal_info(p_tenant_id uuid)
RETURNS TABLE(
  hotel_name text,
  hotel_logo_url text,
  primary_color text,
  theme text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return minimal, safe data for QR portal display
  RETURN QUERY
  SELECT 
    qs.hotel_name,
    qs.hotel_logo_url,
    qs.primary_color,
    qs.theme::text
  FROM qr_settings qs
  WHERE qs.tenant_id = p_tenant_id;
END;
$$;

-- Add audit log entry for this security fix
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
  'SECURITY_FIX',
  'RLS_POLICY',
  'Secured qr_settings table - removed dangerous public access policy',
  jsonb_build_object(
    'removed_policy', 'Public can read QR settings for guest services',
    'added_policy', 'qr_settings_secure_access',
    'added_function', 'get_qr_portal_info',
    'security_level', 'CRITICAL',
    'guest_access_preserved', true,
    'fix_applied', now()
  )
);