-- Fix data integrity issues for global users and trial signup
-- Clean up any orphaned user records and ensure plan exists

-- 1. Clean up duplicate global users (keep the latest)
DELETE FROM public.users u1
WHERE u1.tenant_id IS NULL 
  AND u1.role = 'SUPER_ADMIN'
  AND EXISTS (
    SELECT 1 FROM public.users u2 
    WHERE u2.email = u1.email 
      AND u2.tenant_id IS NULL 
      AND u2.created_at > u1.created_at
  );

-- 2. Update users with NULL names
UPDATE public.users 
SET name = 'Admin User ' || SUBSTRING(email, 1, POSITION('@' IN email) - 1)
WHERE name IS NULL 
  AND email IS NOT NULL;

-- 3. Ensure Starter plan exists (insert if missing)
INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days)
SELECT 'Starter', 35000.00, 350000.00, 25, 10, '{"basicReports": true, "frontDesk": true}'::jsonb, 14
WHERE NOT EXISTS (
  SELECT 1 FROM public.plans WHERE name ILIKE 'Starter'
);

-- 4. Add unique constraint on email (ignore if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_unique'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- 5. Create index for faster role lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_roles_name_lower_scope 
ON public.roles (LOWER(name), scope, tenant_id);

-- 6. Update role mappings to ensure consistency
UPDATE public.users 
SET role = 'SUPER_ADMIN' 
WHERE role_id IN (
  SELECT id FROM public.roles 
  WHERE name = 'Super Admin' AND scope = 'global'
) AND role != 'SUPER_ADMIN';

UPDATE public.users 
SET role = 'PLATFORM_ADMIN' 
WHERE role_id IN (
  SELECT id FROM public.roles 
  WHERE name = 'Platform Admin' AND scope = 'global'
) AND role != 'PLATFORM_ADMIN';

UPDATE public.users 
SET role = 'SUPPORT_STAFF' 
WHERE role_id IN (
  SELECT id FROM public.roles 
  WHERE name = 'Support Staff' AND scope = 'global'
) AND role != 'SUPPORT_STAFF';

-- 7. Clean up any auth users that don't exist in public.users
-- (This would be handled by the edge functions, but ensure consistency)