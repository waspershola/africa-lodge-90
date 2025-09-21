-- Debug and fix JWT claims access
-- First, let's see what's actually in the JWT
SELECT 
  current_setting('jwt.claims', true) as all_jwt_claims;

-- Update the custom access token hook to set claims at the root level
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

  -- Query the users table with elevated privileges (security definer bypasses RLS)
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

  -- Set the custom claims in the JWT - BOTH user_metadata AND root level
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

-- Fix RLS helper functions to properly read JWT claims
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  role_claim text;
BEGIN
  -- Try multiple ways to get the role from JWT
  BEGIN
    role_claim := current_setting('jwt.claims.role', true);
    IF role_claim IS NOT NULL AND role_claim != '' THEN
      RETURN role_claim;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Try from user_metadata
  BEGIN
    role_claim := (current_setting('jwt.claims.user_metadata', true)::jsonb)->>'role';
    IF role_claim IS NOT NULL AND role_claim != '' THEN
      RETURN role_claim;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Fallback
  RETURN 'STAFF';
END;
$$;

-- Test again
SELECT 
  get_user_role() as role,
  get_user_tenant_id() as tenant_id,
  is_super_admin() as is_super_admin;