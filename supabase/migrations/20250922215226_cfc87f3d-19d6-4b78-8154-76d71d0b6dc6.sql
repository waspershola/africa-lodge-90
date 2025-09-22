-- Migration to backfill missing role_id values in users table
-- This ensures all existing users have proper role references

DO $$
BEGIN
  -- Update users with SUPER_ADMIN role
  UPDATE public.users u
  SET role_id = r.id
  FROM public.roles r
  WHERE u.role_id IS NULL
    AND u.role = 'SUPER_ADMIN'
    AND r.name = 'Super Admin'
    AND r.scope = 'global'
    AND r.tenant_id IS NULL;

  -- Update users with PLATFORM_ADMIN role
  UPDATE public.users u
  SET role_id = r.id
  FROM public.roles r
  WHERE u.role_id IS NULL
    AND u.role = 'PLATFORM_ADMIN'
    AND r.name = 'Platform Admin'
    AND r.scope = 'global'
    AND r.tenant_id IS NULL;

  -- Update users with SUPPORT_STAFF role
  UPDATE public.users u
  SET role_id = r.id
  FROM public.roles r
  WHERE u.role_id IS NULL
    AND u.role = 'SUPPORT_STAFF'
    AND r.name = 'Support Staff'
    AND r.scope = 'global'
    AND r.tenant_id IS NULL;

  -- For tenant users, map common roles
  -- Owner role
  UPDATE public.users u
  SET role_id = r.id
  FROM public.roles r
  WHERE u.role_id IS NULL
    AND u.role = 'OWNER'
    AND r.name = 'Owner'
    AND r.scope = 'tenant'
    AND r.tenant_id = u.tenant_id;

  -- Manager role
  UPDATE public.users u
  SET role_id = r.id
  FROM public.roles r
  WHERE u.role_id IS NULL
    AND u.role = 'MANAGER'
    AND r.name = 'Manager'
    AND r.scope = 'tenant'
    AND r.tenant_id = u.tenant_id;

  -- Front Desk role
  UPDATE public.users u
  SET role_id = r.id
  FROM public.roles r
  WHERE u.role_id IS NULL
    AND u.role = 'FRONT_DESK'
    AND r.name = 'Front Desk'
    AND r.scope = 'tenant'
    AND r.tenant_id = u.tenant_id;

  -- Log the results
  RAISE NOTICE 'Migration completed. Updated users with missing role_id values.';

END $$;

-- Verify the migration results
SELECT 
  u.role,
  r.name as role_name,
  r.scope,
  COUNT(*) as user_count
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
GROUP BY u.role, r.name, r.scope
ORDER BY u.role;