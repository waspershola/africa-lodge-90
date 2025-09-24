-- Fix remaining search_path issues for trigger functions
-- Set search_path for remaining functions that don't have it set

-- Fix update_staff_financials_updated_at function
ALTER FUNCTION public.update_staff_financials_updated_at() SET search_path = 'public';

-- Fix update_updated_at_column function  
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';

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
  'Fixed remaining search_path issues for trigger functions',
  jsonb_build_object(
    'fixed_functions', ARRAY['update_staff_financials_updated_at', 'update_updated_at_column'],
    'vulnerability', 'search_path_injection',
    'security_level', 'MEDIUM',
    'fix_applied', now()
  )
);