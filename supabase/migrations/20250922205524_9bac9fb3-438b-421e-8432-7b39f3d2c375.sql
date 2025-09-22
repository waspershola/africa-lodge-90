-- Phase A Emergency Fix: Update role check constraint to include all valid legacy roles
-- This fixes the immediate issue with role constraint violations

-- First, let's see what roles are currently allowed and add missing ones
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add comprehensive role check constraint that includes all legacy roles being used
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN (
  -- Global roles
  'SUPER_ADMIN',
  'PLATFORM_ADMIN', 
  'SUPPORT_STAFF',
  'SALES',
  -- Tenant roles
  'OWNER',
  'MANAGER', 
  'FRONT_DESK',
  'HOUSEKEEPING',
  'MAINTENANCE',
  'ACCOUNTING',
  'POS',
  'STAFF',
  -- Legacy role names for backward compatibility
  'HOTEL_OWNER',
  'HOTEL_MANAGER',
  'EVENT_MANAGER',
  'MARKETING',
  'SECURITY',
  'IT_ADMIN',
  'POS_STAFF'
));

-- Create index for better performance on role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON public.users(tenant_id, role) WHERE tenant_id IS NOT NULL;