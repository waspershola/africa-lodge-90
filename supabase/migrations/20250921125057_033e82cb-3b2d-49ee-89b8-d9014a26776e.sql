-- Fix RLS helper functions to work with JWT claims properly
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First try to get role from JWT claims (this should work with our custom hook)
  RETURN COALESCE(
    NULLIF(current_setting('jwt.claims.role', true), ''),
    NULLIF(current_setting('jwt.claims.user_metadata', true)::jsonb->>'role', ''),
    'STAFF'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'STAFF';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN get_user_role() = 'SUPER_ADMIN';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Get tenant_id from JWT claims
  RETURN COALESCE(
    NULLIF(current_setting('jwt.claims.tenant_id', true), '')::UUID,
    NULLIF(current_setting('jwt.claims.user_metadata', true)::jsonb->>'tenant_id', '')::UUID
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Test the functions
SELECT 
  get_user_role() as role,
  get_user_tenant_id() as tenant_id,
  is_super_admin() as is_super_admin;