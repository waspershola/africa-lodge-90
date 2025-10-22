-- Fix Foreign Key Constraint to Allow QR Code Deletion
-- Issue: Cannot delete qr_codes because guest_sessions has a restrictive foreign key
-- Solution: Change foreign key to CASCADE delete or SET NULL

-- First, let's check and drop the existing constraint
ALTER TABLE guest_sessions 
  DROP CONSTRAINT IF EXISTS fk_guest_sessions_qr_code;

ALTER TABLE guest_sessions 
  DROP CONSTRAINT IF EXISTS guest_sessions_qr_code_id_fkey;

-- Recreate with ON DELETE CASCADE
-- This will automatically delete guest sessions when their QR code is deleted
ALTER TABLE guest_sessions
  ADD CONSTRAINT guest_sessions_qr_code_id_fkey 
  FOREIGN KEY (qr_code_id) 
  REFERENCES qr_codes(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT guest_sessions_qr_code_id_fkey ON guest_sessions IS 
  'Cascades delete - removes guest sessions when QR code is deleted';

-- Also fix qr_requests foreign key if it exists
ALTER TABLE qr_requests
  DROP CONSTRAINT IF EXISTS qr_requests_qr_code_id_fkey;

ALTER TABLE qr_requests
  ADD CONSTRAINT qr_requests_qr_code_id_fkey 
  FOREIGN KEY (qr_code_id) 
  REFERENCES qr_codes(id) 
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT qr_requests_qr_code_id_fkey ON qr_requests IS 
  'Sets to NULL - preserves request history even if QR code is deleted';