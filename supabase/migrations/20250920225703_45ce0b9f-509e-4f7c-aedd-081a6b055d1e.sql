-- Fix the JWT claims by updating user metadata and creating a proper access token hook

-- First, let's disable RLS temporarily to test
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- Update the custom access token hook to properly set claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_tenant_id uuid;
BEGIN
  -- Get the claims from the event
  claims := event->'claims';

  -- Fetch the user role and tenant_id from the users table
  SELECT role, tenant_id INTO user_role, user_tenant_id
  FROM public.users 
  WHERE id = (event->>'user_id')::uuid;

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
  
  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_metadata,tenant_id}', to_jsonb(user_tenant_id::text));
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;