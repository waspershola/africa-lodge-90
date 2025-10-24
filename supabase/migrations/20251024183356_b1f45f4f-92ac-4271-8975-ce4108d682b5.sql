-- Allow public (guest) access to read active QR codes
-- Guests need to validate QR tokens when they scan them
CREATE POLICY "Guests can read active QR codes"
ON qr_codes
FOR SELECT
TO public
USING (
  is_active = true
  AND qr_token IS NOT NULL
);