-- Phase 1: Add qr_requests to realtime publication
-- This enables real-time notifications for QR requests at the front desk

-- Enable realtime for qr_requests table
ALTER TABLE qr_requests REPLICA IDENTITY FULL;

-- Add qr_requests to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE qr_requests;

-- Log the change
COMMENT ON TABLE qr_requests IS 'QR guest requests with realtime updates enabled for instant staff notifications';