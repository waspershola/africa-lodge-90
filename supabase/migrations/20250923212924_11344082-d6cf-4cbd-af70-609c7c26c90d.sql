-- Allow public access to active QR codes for guest portal
CREATE POLICY "Public can view active QR codes" 
ON public.qr_codes 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Allow public access to tenant info needed for QR portal
CREATE POLICY "Public can view basic tenant info" 
ON public.tenants 
FOR SELECT 
TO anon, authenticated
USING (true);