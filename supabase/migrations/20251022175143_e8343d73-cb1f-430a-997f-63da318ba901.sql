-- P1: Add persistent request history and resume links
-- Enhance qr_requests for session tracking and resume URLs

ALTER TABLE qr_requests 
  ADD COLUMN IF NOT EXISTS session_token TEXT,
  ADD COLUMN IF NOT EXISTS resume_short_url TEXT,
  ADD COLUMN IF NOT EXISTS is_persistent BOOLEAN DEFAULT true;

-- Add index for session lookups
CREATE INDEX IF NOT EXISTS idx_qr_requests_session 
  ON qr_requests(session_token) 
  WHERE session_token IS NOT NULL;

-- Add index for resume URL lookups
CREATE INDEX IF NOT EXISTS idx_qr_requests_resume 
  ON qr_requests(resume_short_url) 
  WHERE resume_short_url IS NOT NULL;

COMMENT ON COLUMN qr_requests.session_token IS 'Guest session token for history tracking';
COMMENT ON COLUMN qr_requests.resume_short_url IS 'Short URL for guests to resume/view this request';
COMMENT ON COLUMN qr_requests.is_persistent IS 'Whether request should be kept in history (false for temporary/disposable requests)';