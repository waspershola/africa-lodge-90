-- Security Fix: Move pg_trgm extension to dedicated extensions schema
-- This addresses linter warning about "Extension in Public Schema"

-- Step 1: Create dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Move pg_trgm extension to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Step 3: Update search_path for public schema to include extensions
-- This ensures all existing code can still find pg_trgm functions
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Step 4: Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Step 5: Audit log entry
INSERT INTO audit_log (
  action, 
  resource_type, 
  description, 
  metadata
) VALUES (
  'SECURITY_HARDENING',
  'DATABASE',
  'Moved pg_trgm extension to dedicated extensions schema',
  jsonb_build_object(
    'change', 'Moved pg_trgm from public to extensions schema',
    'reason', 'Security best practice - extensions should not be in public schema',
    'impact', 'All existing queries will continue to work via search_path',
    'remaining_warnings', ARRAY[
      'pg_trgm extension functions (gin_*, gtrgm_*) are PostgreSQL internals - cannot set search_path on them',
      'Leaked password protection must be enabled in Supabase Dashboard Auth settings'
    ],
    'migration_date', NOW()
  )
);

-- Note: The "Function Search Path Mutable" warnings for gin_extract_value_trgm, 
-- gtrgm_compress, etc. are internal PostgreSQL extension functions.
-- These are system-managed and cannot be modified by users.
-- This is expected behavior and safe to have these warnings.