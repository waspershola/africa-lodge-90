-- Fix orphaned auth user by creating missing users record
INSERT INTO public.users (
  id, email, name, role, department, tenant_id, is_platform_owner, is_active, force_reset
) VALUES (
  '738a5b3b-af1a-412c-a7ee-1b2f644a31bb',
  'tiu@gmail.com', 
  'Existing Super Admin',
  'SUPER_ADMIN',
  'IT',
  NULL,
  true,
  true,
  false
) ON CONFLICT (id) DO NOTHING;