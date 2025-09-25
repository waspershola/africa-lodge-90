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

-- Get the user IDs that need to be cleaned up
CREATE TEMP TABLE users_to_cleanup AS (
  SELECT id FROM public.users 
  WHERE (is_platform_owner = true AND tenant_id IS NULL AND email NOT IN ('wasperstore@gmail.com', 'info@waspersolution.com', 'sholawasiu@gmail.com'))
  OR email IN ('ceo@waspersolution.com', 'waspershola@gmail.com')
);

-- Clean up ALL dependent records systematically (including recovery_sessions)
DELETE FROM public.recovery_sessions WHERE user_id IN (SELECT id FROM users_to_cleanup);
DELETE FROM public.recovery_codes WHERE user_id IN (SELECT id FROM users_to_cleanup);
DELETE FROM public.emergency_access_attempts WHERE user_id IN (SELECT id FROM users_to_cleanup);
DELETE FROM public.audit_log WHERE actor_id IN (SELECT id FROM users_to_cleanup);
DELETE FROM public.impersonations WHERE original_user_id IN (SELECT id FROM users_to_cleanup) OR impersonated_user_id IN (SELECT id FROM users_to_cleanup);

-- Handle any other user references that might exist
UPDATE public.housekeeping_tasks SET assigned_to = NULL WHERE assigned_to IN (SELECT id FROM users_to_cleanup);
UPDATE public.housekeeping_tasks SET created_by = NULL WHERE created_by IN (SELECT id FROM users_to_cleanup);
UPDATE public.pos_orders SET taken_by = NULL WHERE taken_by IN (SELECT id FROM users_to_cleanup);
UPDATE public.pos_orders SET prepared_by = NULL WHERE prepared_by IN (SELECT id FROM users_to_cleanup);
UPDATE public.pos_orders SET served_by = NULL WHERE served_by IN (SELECT id FROM users_to_cleanup);
UPDATE public.payments SET processed_by = NULL WHERE processed_by IN (SELECT id FROM users_to_cleanup);
UPDATE public.folios SET closed_by = NULL WHERE closed_by IN (SELECT id FROM users_to_cleanup);

-- Now delete the users
DELETE FROM public.users WHERE id IN (SELECT id FROM users_to_cleanup);

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

-- Clean up temp table
DROP TABLE users_to_cleanup;

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