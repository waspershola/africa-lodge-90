-- Add SMS notification tracking columns (guest_phone already exists)
ALTER TABLE qr_requests 
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for SMS tracking
CREATE INDEX IF NOT EXISTS idx_qr_requests_sms ON qr_requests(sms_enabled, sms_sent) WHERE sms_enabled = true;

-- Add comments
COMMENT ON COLUMN qr_requests.sms_enabled IS 'Whether guest opted in for SMS updates';
COMMENT ON COLUMN qr_requests.sms_sent IS 'Whether confirmation SMS was sent';
COMMENT ON COLUMN qr_requests.sms_sent_at IS 'Timestamp when SMS was sent';