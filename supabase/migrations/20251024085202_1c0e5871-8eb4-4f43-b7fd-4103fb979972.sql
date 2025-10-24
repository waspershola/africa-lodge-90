-- Fix foreign key constraint for qr_requests.session_id
-- Step 1: Clean up orphaned records that reference non-existent sessions

-- Delete orphaned qr_requests records where session_id doesn't exist in guest_sessions.id
DELETE FROM qr_requests
WHERE session_id NOT IN (SELECT id FROM guest_sessions);

-- Step 2: Drop the incorrectly configured foreign key constraint
ALTER TABLE qr_requests 
DROP CONSTRAINT IF EXISTS qr_requests_session_id_fkey;

-- Step 3: Recreate the foreign key constraint pointing to the correct column (guest_sessions.id)
ALTER TABLE qr_requests 
ADD CONSTRAINT qr_requests_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES guest_sessions(id) 
ON DELETE CASCADE;

-- Step 4: Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_qr_requests_session_id ON qr_requests(session_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT qr_requests_session_id_fkey ON qr_requests IS 'References guest_sessions.id (primary key), not session_id column';