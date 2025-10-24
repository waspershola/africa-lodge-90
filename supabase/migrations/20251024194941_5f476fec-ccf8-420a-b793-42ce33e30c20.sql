-- ========================================
-- MIGRATION: Session-Based QR Access
-- Implements permanent QR codes with 12-hour guest sessions
-- Fixes RLS to allow anonymous guests to read active sessions
-- ========================================

-- Step 1: Fix RLS for guest_sessions (CRITICAL)
-- Allows anonymous guests to read active sessions for JOIN queries
CREATE POLICY "Guests can read active sessions" ON guest_sessions
FOR SELECT
TO public
USING (
  is_active = true 
  AND expires_at > NOW()
);

COMMENT ON POLICY "Guests can read active sessions" ON guest_sessions IS 
'Allows anonymous guests to read active session records for JOIN queries. Contains no PII, only UUIDs.';

-- Step 2: Update session lifetime to 12 hours
ALTER TABLE qr_settings 
ALTER COLUMN session_lifetime_hours SET DEFAULT 12;

UPDATE qr_settings 
SET session_lifetime_hours = 12 
WHERE session_lifetime_hours != 12 OR session_lifetime_hours IS NULL;

-- Step 3: Ensure QR codes remain active permanently
UPDATE qr_codes 
SET expires_at = NULL, is_active = true
WHERE expires_at IS NOT NULL OR is_active = false;

-- Step 4: Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE guest_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_guest_sessions() IS 
'Marks expired guest sessions as inactive. Returns count of cleaned sessions. Run daily via cron or manually.';

-- Step 5: Add index for session expiration queries (performance)
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expiration_lookup 
ON guest_sessions(is_active, expires_at) 
WHERE is_active = true;

-- Step 6: Add helpful constraints and comments
COMMENT ON COLUMN qr_codes.expires_at IS 
'QR code expiration (should be NULL for permanent QR codes that remain active)';

COMMENT ON COLUMN guest_sessions.expires_at IS 
'Session expiration timestamp (default 12 hours from creation). Guest must rescan QR after expiration.';

COMMENT ON COLUMN qr_settings.session_lifetime_hours IS 
'Guest session lifetime in hours (default: 12). After expiration, guest must rescan QR to create new session.';