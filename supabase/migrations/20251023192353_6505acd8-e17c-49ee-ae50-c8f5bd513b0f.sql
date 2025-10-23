-- Add tracking_number column to qr_requests table
-- This column is used by the create_unified_qr_request RPC function to store guest-facing tracking numbers

ALTER TABLE qr_requests 
ADD COLUMN IF NOT EXISTS tracking_number text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_requests_tracking_number ON qr_requests(tracking_number);

-- Add comment for documentation
COMMENT ON COLUMN qr_requests.tracking_number IS 'Guest-facing tracking number in format QR-YYYYMMDD-XXXX';