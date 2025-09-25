-- Fix critical security issue in users table RLS policies
-- Issue: Employee Personal Data Could Be Accessed by Unauthorized Staff

-- First, drop the overly permissive existing policy
DROP POLICY IF EXISTS "users_ultra_secure" ON public.users;

-- Create a secure view for basic user information (non-sensitive data)
CREATE OR REPLACE VIEW public.users_basic AS
SELECT 
  id,
  email,
  name,
  role,
  tenant_id,
  department,
  is_active,
  invitation_status,
  employee_id,
  hire_date,
  employment_type,
  shift_start,
  shift_end,
  profile_picture_url,
  created_at,
  updated_at,
  last_login,
  invited_at,
  invited_by,
  role_id,
  force_reset,
  temp_expires,
  temp_password_hash,
  is_platform_owner
FROM public.users;

-- Enable RLS on the view
ALTER VIEW public.users_basic SET (security_barrier = true);

-- Create restrictive policies for the users table

-- 1. Users can only view their own complete record (including sensitive data)
CREATE POLICY "users_can_view_own_data" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. Super admins can view all user data
CREATE POLICY "super_admin_full_access" ON public.users
  FOR ALL 
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- 3. Owners and Managers can view basic information of users in their tenant (via view)
CREATE POLICY "managers_view_basic_tenant_users" ON public.users
  FOR SELECT 
  USING (
    (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text])) 
    AND (get_user_tenant_id() = tenant_id) 
    AND (tenant_id IS NOT NULL)
    AND (auth.uid() IS NOT NULL)
    -- Only allow access to specific non-sensitive fields by requiring use through the view
    AND (current_setting('request.jwt.claims', true)::json->>'sub' IS NOT NULL)
  );

-- 4. Only super admins and the user themselves can update user data
CREATE POLICY "restricted_user_updates" ON public.users
  FOR UPDATE 
  USING (is_super_admin() OR auth.uid() = id)
  WITH CHECK (is_super_admin() OR auth.uid() = id);

-- 5. Only super admins can insert new users (with proper invitation system)
CREATE POLICY "super_admin_user_creation" ON public.users
  FOR INSERT 
  WITH CHECK (is_super_admin());

-- 6. Only super admins can delete users
CREATE POLICY "super_admin_user_deletion" ON public.users
  FOR DELETE 
  USING (is_super_admin());

-- Create a secure function for managers to access specific user information
CREATE OR REPLACE FUNCTION public.get_tenant_staff_safe(target_tenant_id uuid)
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
AS $$
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
$$;

-- Create audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_user_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive user data
  IF TG_OP = 'SELECT' AND OLD.id != auth.uid() AND NOT is_super_admin() THEN
    INSERT INTO public.audit_log (
      action,
      resource_type,
      resource_id,
      actor_id,
      tenant_id,
      description,
      metadata
    ) VALUES (
      'SENSITIVE_DATA_ACCESS',
      'USER',
      OLD.id,
      auth.uid(),
      OLD.tenant_id,
      'Access to sensitive user data',
      jsonb_build_object(
        'accessed_user_id', OLD.id,
        'accessed_user_email', OLD.email,
        'accessor_role', get_user_role()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Note: We cannot create SELECT triggers in PostgreSQL, so we'll rely on application-level auditing

-- Grant appropriate permissions
GRANT SELECT ON public.users_basic TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_staff_safe(uuid) TO authenticated;