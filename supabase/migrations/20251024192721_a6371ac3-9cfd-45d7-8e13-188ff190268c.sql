-- Step 1: Clean up orphaned qr_requests before fixing foreign key

-- Find and delete orphaned requests where session_id doesn't exist in guest_sessions
DELETE FROM qr_requests
WHERE session_id NOT IN (SELECT session_id FROM guest_sessions);

-- Step 2: Drop old foreign key constraint
ALTER TABLE qr_requests 
DROP CONSTRAINT IF EXISTS qr_requests_session_id_fkey;

-- Step 3: Add unique constraint to guest_sessions.session_id
ALTER TABLE guest_sessions 
ADD CONSTRAINT guest_sessions_session_id_unique UNIQUE (session_id);

-- Step 4: Create new foreign key pointing to session_id (business UUID)
ALTER TABLE qr_requests
ADD CONSTRAINT qr_requests_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES guest_sessions(session_id) 
ON DELETE CASCADE;

COMMENT ON CONSTRAINT qr_requests_session_id_fkey ON qr_requests 
IS 'Links to guest_sessions.session_id (business UUID) not id (PK)';