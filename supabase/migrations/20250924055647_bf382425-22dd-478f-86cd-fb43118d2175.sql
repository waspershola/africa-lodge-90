-- Fix security vulnerability: Set search_path for SECURITY DEFINER functions
-- This prevents SQL injection attacks through search_path manipulation

-- Update existing SECURITY DEFINER functions to have proper search_path settings
-- (Functions created in this session already have proper search_path)

-- Fix any functions that might not have search_path set
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find all SECURITY DEFINER functions without proper search_path
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.prosecdef = true  -- SECURITY DEFINER functions
        AND n.nspname = 'public'  -- Only public schema
        AND p.proname NOT IN (
            'get_qr_portal_info'  -- Already fixed in this migration
        )
    LOOP
        -- Update the function to set search_path = 'public'
        -- This is safer than empty search_path for our use case
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''public''', 
                      func_record.function_name, 
                      func_record.args);
        
        RAISE NOTICE 'Fixed search_path for function: %', func_record.function_name;
    END LOOP;
END $$;

-- Add audit log entry for this security fix
INSERT INTO public.audit_log (
  actor_id,
  actor_email,
  action,
  resource_type,
  description,
  metadata
) VALUES (
  auth.uid(),
  COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'system'),
  'SECURITY_FIX',
  'DATABASE_FUNCTION',
  'Fixed search_path vulnerability in SECURITY DEFINER functions',
  jsonb_build_object(
    'vulnerability', 'CVE-2007-2138',
    'fix_type', 'search_path_hardening',
    'security_level', 'HIGH',
    'fix_applied', now()
  )
);