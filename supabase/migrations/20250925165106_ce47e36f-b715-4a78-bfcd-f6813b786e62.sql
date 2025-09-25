-- Create the new system owners directly
INSERT INTO public.users (
  id, 
  email, 
  name, 
  role, 
  is_platform_owner, 
  is_active,
  force_reset,
  tenant_id
) VALUES 
(
  gen_random_uuid(),
  'ceo@waspersolution.com',
  'Wasiu',
  'SUPER_ADMIN',
  true,
  true,
  true,
  NULL
),
(
  gen_random_uuid(),
  'waspershola@gmail.com', 
  'Shola',
  'SUPER_ADMIN',
  true,
  true,
  true,
  NULL
);

-- Also clean up any orphaned auth users for the backup admins
-- This requires the service role to execute