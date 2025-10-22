-- P0: Optimize short_urls table for 6-char codes and session tracking
-- Add session_token, link_type, and short_domain columns

ALTER TABLE short_urls 
  ADD COLUMN IF NOT EXISTS session_token TEXT,
  ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'qr_redirect',
  ADD COLUMN IF NOT EXISTS short_domain TEXT DEFAULT 'q.wsp';

-- Add index for session lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_session 
  ON short_urls(session_token) 
  WHERE session_token IS NOT NULL;

-- Add index for expiry cleanup
CREATE INDEX IF NOT EXISTS idx_short_urls_expires 
  ON short_urls(expires_at) 
  WHERE expires_at IS NOT NULL;

COMMENT ON COLUMN short_urls.session_token IS 'Links short URL to guest session for resume functionality';
COMMENT ON COLUMN short_urls.link_type IS 'Type: qr_redirect, session_resume, menu_link';
COMMENT ON COLUMN short_urls.short_domain IS 'Domain prefix for branded short URLs';