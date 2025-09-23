-- Fix get_user_role function to query database directly
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  user_id uuid;
BEGIN
  -- Get current user ID from auth context
  user_id := auth.uid();
  
  -- If no user ID, not authenticated
  IF user_id IS NULL THEN
    RETURN 'GUEST';
  END IF;
  
  -- Query the users table directly to check role
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = user_id;
  
  -- Return the role or default to STAFF if not found
  RETURN COALESCE(user_role, 'STAFF');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'STAFF';
END;
$function$;

-- Fix get_user_tenant_id function to query database directly
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_tenant_id uuid;
  user_id uuid;
BEGIN
  -- Get current user ID from auth context
  user_id := auth.uid();
  
  -- If no user ID, not authenticated
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Query the users table directly to get tenant_id
  SELECT tenant_id INTO user_tenant_id 
  FROM public.users 
  WHERE id = user_id;
  
  RETURN user_tenant_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;