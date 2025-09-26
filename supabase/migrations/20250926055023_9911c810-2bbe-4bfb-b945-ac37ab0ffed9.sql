-- Phase 1: Standardize role names to use underscores
UPDATE public.roles 
SET name = 'SUPER_ADMIN' 
WHERE name = 'Super Admin' AND scope = 'global';

UPDATE public.roles 
SET name = 'PLATFORM_ADMIN' 
WHERE name = 'Platform Admin' AND scope = 'global';

UPDATE public.roles 
SET name = 'SUPPORT_ADMIN' 
WHERE name = 'Support Admin' AND scope = 'global';

UPDATE public.roles 
SET name = 'SUPPORT_STAFF' 
WHERE name = 'Support Staff' AND scope = 'global';

-- Update existing user records that reference old role names
UPDATE public.users 
SET role = 'SUPER_ADMIN' 
WHERE role = 'Super Admin';

UPDATE public.users 
SET role = 'PLATFORM_ADMIN' 
WHERE role = 'Platform Admin';

UPDATE public.users 
SET role = 'SUPPORT_ADMIN' 
WHERE role = 'Support Admin';

UPDATE public.users 
SET role = 'SUPPORT_STAFF' 
WHERE role = 'Support Staff';

-- Fix permission assignments - Support Admin should have more permissions than Support Staff
-- First, let's ensure Support Admin has all Support Staff permissions plus additional ones
WITH support_staff_permissions AS (
  SELECT rp.permission_id
  FROM public.roles r
  JOIN public.role_permissions rp ON r.id = rp.role_id
  WHERE r.name = 'SUPPORT_STAFF' AND r.scope = 'global'
),
support_admin_role AS (
  SELECT id FROM public.roles 
  WHERE name = 'SUPPORT_ADMIN' AND scope = 'global'
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT sar.id, ssp.permission_id
FROM support_admin_role sar
CROSS JOIN support_staff_permissions ssp
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp2
  WHERE rp2.role_id = sar.id AND rp2.permission_id = ssp.permission_id
);

-- Add additional permissions for Support Admin that Support Staff doesn't have
WITH support_admin_role AS (
  SELECT id FROM public.roles 
  WHERE name = 'SUPPORT_ADMIN' AND scope = 'global'
),
additional_permissions AS (
  SELECT p.id as permission_id
  FROM public.permissions p
  WHERE p.name IN (
    'tenants.write',  -- Can modify tenant settings
    'users.write',    -- Can modify user accounts
    'support.manage', -- Can manage support tickets
    'billing.write',  -- Can handle billing issues
    'plans.write'     -- Can modify subscription plans
  )
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT sar.id, ap.permission_id
FROM support_admin_role sar
CROSS JOIN additional_permissions ap
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp2
  WHERE rp2.role_id = sar.id AND rp2.permission_id = ap.permission_id
);