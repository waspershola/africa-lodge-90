-- First, temporarily replace the protection function with a permissive one
CREATE OR REPLACE FUNCTION public.prevent_platform_owner_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Temporarily allow all changes for system owner cleanup
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Clean up all dependent records before deleting users
DELETE FROM public.recovery_sessions WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE (is_platform_owner = true AND tenant_id IS NULL AND email NOT IN ('wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com'))
  OR email IN ('ceo@waspersolution.com', 'waspershola@gmail.com')
);

DELETE FROM public.recovery_codes WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE (is_platform_owner = true AND tenant_id IS NULL AND email NOT IN ('wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com'))
  OR email IN ('ceo@waspersolution.com', 'waspershola@gmail.com')
);

DELETE FROM public.emergency_access_attempts WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE (is_platform_owner = true AND tenant_id IS NULL AND email NOT IN ('wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com'))
  OR email IN ('ceo@waspersolution.com', 'waspershola@gmail.com')
);

-- Delete users without valid tenant_id (platform owners without tenant shouldn't exist)
DELETE FROM public.users 
WHERE is_platform_owner = true 
AND tenant_id IS NULL
AND email NOT IN ('wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com');

-- Delete specific users that should be removed entirely 
DELETE FROM public.users 
WHERE email IN ('ceo@waspersolution.com', 'waspershola@gmail.com');

-- For remaining platform owners not in approved list, demote them to STAFF
UPDATE public.users 
SET is_platform_owner = false, 
    role = 'STAFF'
WHERE is_platform_owner = true 
AND email NOT IN ('wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com');

-- Ensure approved users are system owners with proper settings
UPDATE public.users 
SET is_platform_owner = true, 
    role = 'SUPER_ADMIN'
WHERE email IN ('wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com');

-- Restore the original protection function
CREATE OR REPLACE FUNCTION public.prevent_platform_owner_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Strict protection for all platform owners
  IF OLD.is_platform_owner = true AND (
    TG_OP = 'DELETE' OR 
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.is_platform_owner IS DISTINCT FROM OLD.is_platform_owner
  ) THEN
    RAISE EXCEPTION 'Platform owner cannot be deleted, have role changed, or lose platform owner status';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;