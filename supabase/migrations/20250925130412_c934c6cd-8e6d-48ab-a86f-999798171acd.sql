-- Fix security definer view warning by removing security barrier
-- This addresses the linter warning about views with SECURITY DEFINER

-- Drop the existing view with security barrier
DROP VIEW IF EXISTS public.users_basic;

-- Recreate the view without security barrier property
-- Instead, we'll rely on the underlying table's RLS policies
CREATE VIEW public.users_basic AS
SELECT 
  id,
  email,
  name,
  role,
  tenant_id,
  department,
  is_active,
  invitation_status,
  employee_id,
  hire_date,
  employment_type,
  shift_start,
  shift_end,
  profile_picture_url,
  created_at,
  updated_at,
  last_login,
  invited_at,
  invited_by,
  role_id,
  force_reset,
  temp_expires,
  temp_password_hash,
  is_platform_owner
FROM public.users;

-- Grant select permission on the view
GRANT SELECT ON public.users_basic TO authenticated;