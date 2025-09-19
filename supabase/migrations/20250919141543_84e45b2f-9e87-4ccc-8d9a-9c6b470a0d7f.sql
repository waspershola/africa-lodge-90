-- Enable RLS on the remaining tables (plans and feature_flags are global so they don't need RLS)
-- But let's check what tables still need RLS

-- First, let's verify which tables don't have RLS enabled
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false
        AND tablename NOT IN ('plans', 'feature_flags') -- Global tables that don't need RLS
    LOOP
        RAISE NOTICE 'Table %.% does not have RLS enabled', rec.schemaname, rec.tablename;
        EXECUTE 'ALTER TABLE ' || rec.schemaname || '.' || rec.tablename || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;