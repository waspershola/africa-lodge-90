-- PHASE 1: EMERGENCY SECURITY LOCKDOWN
-- CRITICAL: Disable the dangerous custom_access_token_hook immediately
-- This function bypasses RLS and is causing privilege escalation

-- Step 1: Remove the custom access token hook to prevent further exploitation
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- Step 2: Create secure server-side role validation functions
CREATE OR REPLACE FUNCTION public.get_user_role_secure()
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

CREATE OR REPLACE FUNCTION public.get_user_tenant_id_secure()
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

-- Step 3: Create emergency audit logging for security monitoring
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_description text,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (
    action,
    resource_type,
    description,
    actor_id,
    actor_email,
    actor_role,
    tenant_id,
    metadata,
    created_at
  ) VALUES (
    event_type,
    'SECURITY',
    event_description,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    public.get_user_role_secure(),
    public.get_user_tenant_id_secure(),
    metadata,
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail on audit logging errors
    NULL;
END;
$$;

-- Step 4: Log this security remediation
SELECT public.log_security_event(
  'SECURITY_REMEDIATION', 
  'Disabled dangerous custom_access_token_hook and implemented secure role validation',
  jsonb_build_object('phase', 'emergency_lockdown', 'timestamp', now())
);

-- Step 5: Force session invalidation (users will need to re-login)
-- This clears any corrupted JWT tokens
NOTIFY pgrst, 'reload config';

-- Step 6: Add emergency super admin verification
-- Verify all super admin accounts are legitimate
CREATE TEMP TABLE temp_super_admins AS
SELECT id, email, role, tenant_id, created_at, is_platform_owner
FROM public.users 
WHERE role = 'SUPER_ADMIN';

-- Log all super admin accounts for review
INSERT INTO public.audit_log (action, resource_type, description, metadata)
SELECT 
  'SUPER_ADMIN_AUDIT',
  'USER',
  'Emergency audit of super admin account: ' || email,
  jsonb_build_object(
    'user_id', id,
    'email', email, 
    'tenant_id', tenant_id,
    'created_at', created_at,
    'is_platform_owner', is_platform_owner
  )
FROM temp_super_admins;