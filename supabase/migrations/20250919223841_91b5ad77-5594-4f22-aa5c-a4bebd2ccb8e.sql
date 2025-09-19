-- Fix users table constraint to allow SUPER_ADMIN with NULL tenant_id
-- First drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tenant_required;

-- Add updated constraint that allows SUPER_ADMIN to have NULL tenant_id
ALTER TABLE public.users ADD CONSTRAINT users_tenant_required 
CHECK (
  (role = 'SUPER_ADMIN' AND tenant_id IS NULL) OR 
  (role != 'SUPER_ADMIN' AND tenant_id IS NOT NULL)
);