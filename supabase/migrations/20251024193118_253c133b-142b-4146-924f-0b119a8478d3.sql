-- Fix RLS policies for qr_requests after session_id foreign key correction

-- Drop old broken policy that compared UUID to integer
DROP POLICY IF EXISTS "Guests can view their requests via session" ON qr_requests;

-- Create corrected policy that properly joins on session_id (UUID)
CREATE POLICY "Guests can view requests via qr_token" ON qr_requests
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM guest_sessions gs
    JOIN qr_codes qc ON qc.id = gs.qr_code_id
    WHERE gs.session_id = qr_requests.session_id
    AND gs.is_active = true
    AND gs.expires_at > NOW()
  )
);

COMMENT ON POLICY "Guests can view requests via qr_token" ON qr_requests IS 
'Allows anonymous guests to view requests for active, non-expired sessions. Fixed to use session_id (UUID) correctly.';