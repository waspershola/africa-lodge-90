-- Fix the users_tenant_id_check constraint to allow null tenant_id for global users
-- Global users (like SUPER_ADMIN, PLATFORM_ADMIN) should be allowed to have null tenant_id

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tenant_id_check;

-- Add a new constraint that allows null tenant_id OR requires tenant_id for non-global roles
ALTER TABLE public.users ADD CONSTRAINT users_tenant_id_check 
CHECK (
  (tenant_id IS NULL AND role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_STAFF')) OR
  (tenant_id IS NOT NULL AND role NOT IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_STAFF'))
);