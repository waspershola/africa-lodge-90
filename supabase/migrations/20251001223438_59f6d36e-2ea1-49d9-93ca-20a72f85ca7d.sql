-- Fix 1: Create debug function to diagnose auth context issues
CREATE OR REPLACE FUNCTION public.debug_auth_state()
RETURNS TABLE(
  current_auth_uid uuid,
  user_exists boolean,
  user_role text,
  is_super_admin_result boolean,
  session_info text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_uid uuid;
  v_user_exists boolean;
  v_user_role text;
  v_is_sa boolean;
BEGIN
  v_auth_uid := auth.uid();
  
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = v_auth_uid) INTO v_user_exists;
  
  SELECT role INTO v_user_role FROM public.users WHERE id = v_auth_uid;
  
  v_is_sa := is_super_admin();
  
  RETURN QUERY SELECT 
    v_auth_uid,
    v_user_exists,
    COALESCE(v_user_role, 'NO_USER_FOUND'),
    v_is_sa,
    CASE 
      WHEN v_auth_uid IS NULL THEN 'No auth context - session invalid'
      WHEN NOT v_user_exists THEN 'Auth UID exists but no user record'
      WHEN v_user_role != 'SUPER_ADMIN' THEN 'User found but not super admin'
      ELSE 'User is super admin'
    END;
END;
$$;

-- Fix 2: Create more robust super admin check with explicit session validation
CREATE OR REPLACE FUNCTION public.is_super_admin_with_session()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current auth UID
  v_user_id := auth.uid();
  
  -- If no auth context, return false immediately
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is super admin with platform owner flag
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_user_id 
    AND role = 'SUPER_ADMIN'
    AND is_active = true
    AND is_platform_owner = true
  ) INTO v_is_admin;
  
  RETURN COALESCE(v_is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'is_super_admin_with_session failed: %', SQLERRM;
    RETURN false;
END;
$$;

-- Fix 3: Update RLS policy to use the more robust function
DROP POLICY IF EXISTS "super_admin_manage_feature_flags" ON public.feature_flags;

CREATE POLICY "super_admin_manage_feature_flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (
  is_super_admin_with_session() OR 
  is_super_admin() OR
  -- Fallback: Check platform owner directly
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND is_platform_owner = true 
    AND is_active = true
  )
)
WITH CHECK (
  is_super_admin_with_session() OR 
  is_super_admin() OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND is_platform_owner = true 
    AND is_active = true
  )
);

-- Fix 4: Initialize missing feature flags with proper defaults
INSERT INTO public.feature_flags (flag_name, description, is_enabled, config)
VALUES 
  ('ff/background_jobs_enabled', 'Controls automated background tasks like auto-checkout and cleanup jobs', false, '{"category": "system", "requires_restart": false}'::jsonb),
  ('ff/paginated_reservations', 'Implements pagination for large reservation lists to improve performance', false, '{"category": "performance", "page_size": 50}'::jsonb)
ON CONFLICT (flag_name) DO UPDATE SET
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  updated_at = now();

-- Fix 5: Add helper function to ensure critical flags exist
CREATE OR REPLACE FUNCTION public.ensure_feature_flag_exists(
  p_flag_name text,
  p_description text DEFAULT '',
  p_is_enabled boolean DEFAULT false,
  p_config jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_flag_id uuid;
BEGIN
  INSERT INTO public.feature_flags (flag_name, description, is_enabled, config)
  VALUES (p_flag_name, p_description, p_is_enabled, p_config)
  ON CONFLICT (flag_name) DO UPDATE SET
    updated_at = now()
  RETURNING id INTO v_flag_id;
  
  RETURN v_flag_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.debug_auth_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_with_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_feature_flag_exists(text, text, boolean, jsonb) TO authenticated;