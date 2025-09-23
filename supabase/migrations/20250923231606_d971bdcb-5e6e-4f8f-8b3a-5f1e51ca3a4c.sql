-- Revert: Remove the public tenant access policy
DROP POLICY IF EXISTS "Public can read basic tenant info for QR codes" ON public.tenants;