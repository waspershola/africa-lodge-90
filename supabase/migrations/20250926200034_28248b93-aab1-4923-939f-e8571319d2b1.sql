-- PHASE 2: Update RLS policies to use secure functions
-- Replace existing RLS helper functions with secure versions

-- Update existing RLS helper functions to use secure database lookups
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role directly from database, not JWT claims
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'GUEST');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'GUEST';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_tenant_id uuid;
BEGIN
  -- Get tenant_id directly from database, not JWT claims
  SELECT tenant_id INTO user_tenant_id 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN user_tenant_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Create secure is_super_admin function 
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
    AND is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Log security improvement
SELECT public.log_security_event(
  'SECURITY_IMPROVEMENT', 
  'Updated RLS helper functions to use secure database validation instead of JWT claims',
  jsonb_build_object('phase', 'rls_security_hardening', 'timestamp', now())
);