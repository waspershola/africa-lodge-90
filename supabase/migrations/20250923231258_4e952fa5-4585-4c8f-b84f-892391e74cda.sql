-- Allow public access to tenant basic info for QR codes
CREATE POLICY "Public can read basic tenant info for QR codes" 
ON public.tenants 
FOR SELECT 
USING (true);