-- Phase 2A: Enable realtime replication for qr_codes table

-- 1. Enable realtime replication for qr_codes table
ALTER PUBLICATION supabase_realtime ADD TABLE qr_codes;

-- 2. Set replica identity to FULL (required for UPDATE events)
ALTER TABLE qr_codes REPLICA IDENTITY FULL;

-- 3. Verify realtime is enabled (for logging purposes)
COMMENT ON TABLE qr_codes IS 'Realtime enabled for cross-device QR code synchronization';
