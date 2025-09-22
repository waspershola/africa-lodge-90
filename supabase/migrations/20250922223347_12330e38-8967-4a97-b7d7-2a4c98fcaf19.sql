-- Drop the conflicting constraint that blocks global users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tenant_required;

-- Ensure the new constraint is properly in place (should already exist from previous migration)
-- This allows NULL tenant_id for global users with specific roles
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_tenant_id_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_tenant_id_check 
CHECK (
  (tenant_id IS NULL AND role IN ('SUPER_ADMIN', 'Super Admin', 'Platform Admin', 'Support Staff', 'Sales')) OR
  (tenant_id IS NOT NULL)
);