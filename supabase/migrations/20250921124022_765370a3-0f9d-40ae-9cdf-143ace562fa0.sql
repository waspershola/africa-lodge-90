-- Fix: Create missing user record for super admin
-- The user exists in auth.users but not in public.users, causing JWT claims to fail

INSERT INTO public.users (
  id, 
  email, 
  role, 
  tenant_id, 
  name,
  is_active,
  created_at,
  updated_at
) VALUES (
  '1debb8f1-ccfc-4edb-b187-0695eac42ae8',
  'wasperstore@gmail.com',
  'SUPER_ADMIN',
  NULL,
  'Abdulwasiu O. Suleiman',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  updated_at = now();

-- Also fix the custom access token hook to be more robust
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_tenant_id uuid;
  user_id_param uuid;
BEGIN
  -- Get the claims from the event
  claims := event->'claims';
  user_id_param := (event->>'user_id')::uuid;

  -- First try to get role and tenant_id from public.users table
  -- Use a more permissive query that bypasses RLS for this security definer function
  SELECT u.role, u.tenant_id INTO user_role, user_tenant_id
  FROM public.users u 
  WHERE u.id = user_id_param;

  -- If no user found in our users table, check user_metadata from the event
  IF user_role IS NULL THEN
    user_role := event->'user_metadata'->>'role';
  END IF;

  IF user_tenant_id IS NULL THEN
    user_tenant_id := (event->'user_metadata'->>'tenant_id')::uuid;
  END IF;

  -- Set the custom claims in the JWT
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_metadata,role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;
  
  -- Handle tenant_id properly (can be NULL for super admins)
  claims := jsonb_set(claims, '{user_metadata,tenant_id}', 
    CASE WHEN user_tenant_id IS NOT NULL 
         THEN to_jsonb(user_tenant_id::text) 
         ELSE 'null'::jsonb 
    END);
  claims := jsonb_set(claims, '{tenant_id}', 
    CASE WHEN user_tenant_id IS NOT NULL 
         THEN to_jsonb(user_tenant_id::text) 
         ELSE 'null'::jsonb 
    END);

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;