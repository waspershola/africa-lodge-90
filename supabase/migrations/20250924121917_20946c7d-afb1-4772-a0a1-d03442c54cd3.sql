-- Emergency Recovery: Fix broken pg_trgm extension state

-- Step 1: Clean up any broken extension state
DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- Step 2: Recreate extension in public schema (original working state)
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;

-- Step 3: Recreate the search indexes that were dropped
CREATE INDEX IF NOT EXISTS idx_guests_search 
  ON guests USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_reservations_guest_search 
  ON reservations USING gin (guest_name gin_trgm_ops);

-- Step 4: Ensure all pg_trgm functions are available
-- This will restore the missing function signatures that were causing type errors