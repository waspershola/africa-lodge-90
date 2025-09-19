-- Fix search path security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table with basic info
  INSERT INTO public.users (id, email, role, tenant_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'STAFF'), 
    (NEW.raw_user_meta_data->>'tenant_id')::uuid
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_tenant_id uuid;
BEGIN
  -- Fetch the user role and tenant_id from the users table
  SELECT role, tenant_id INTO user_role, user_tenant_id
  FROM public.users 
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    -- Set custom claims
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;
  
  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;