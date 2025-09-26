-- Address the users_basic view security issue
-- Remove public access from users_basic view as it exposes sensitive user data
REVOKE ALL ON public.users_basic FROM anon, authenticated, public;

-- Create a secure wrapper function for users_basic view
CREATE OR REPLACE FUNCTION public.get_tenant_users_safe(target_tenant_id uuid)
RETURNS TABLE(
    id uuid, 
    email text, 
    name text, 
    role text, 
    department text, 
    is_active boolean, 
    employee_id text, 
    hire_date date, 
    employment_type text, 
    invitation_status text, 
    last_login timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only allow access if user is OWNER/MANAGER in the target tenant
  IF NOT (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])) 
    AND (get_user_tenant_id() = target_tenant_id)
    AND (target_tenant_id IS NOT NULL)
  ) AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;

  -- Return only safe, non-sensitive user information
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.department,
    u.is_active,
    u.employee_id,
    u.hire_date,
    u.employment_type,
    u.invitation_status,
    u.last_login
  FROM public.users u
  WHERE u.tenant_id = target_tenant_id
  ORDER BY u.name;
END;
$function$;

-- Drop the users_basic view entirely since it's not securely designed
DROP VIEW IF EXISTS public.users_basic;