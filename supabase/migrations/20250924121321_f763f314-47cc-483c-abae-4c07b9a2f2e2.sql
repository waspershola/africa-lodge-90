-- Fix Security Issue: Safely move pg_trgm extension and recreate search indexes

-- 1. Drop dependent search indexes first
DROP INDEX IF EXISTS idx_guests_search;
DROP INDEX IF EXISTS idx_reservations_guest_search;

-- 2. Move extension from public to extensions schema  
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- 3. Recreate search indexes using qualified extension schema
CREATE INDEX IF NOT EXISTS idx_guests_search 
  ON guests USING gin ((first_name || ' ' || last_name) extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_reservations_guest_search 
  ON reservations USING gin (guest_name extensions.gin_trgm_ops);