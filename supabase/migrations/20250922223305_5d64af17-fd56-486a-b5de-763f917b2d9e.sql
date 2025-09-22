-- Fix database constraints and indexes for global user creation
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users (tenant_id);  
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles (tenant_id);

-- Ensure proper constraints on users table for global users
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_tenant_id_check;

-- Add constraint that allows NULL tenant_id for global users
ALTER TABLE public.users 
ADD CONSTRAINT users_tenant_id_check 
CHECK (
  (tenant_id IS NULL AND role IN ('SUPER_ADMIN', 'Super Admin', 'Platform Admin', 'Support Staff', 'Sales')) OR
  (tenant_id IS NOT NULL)
);