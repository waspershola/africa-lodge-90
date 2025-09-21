-- Fix is_super_admin function to handle JWT parsing more robustly
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_id uuid;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- If no user ID, not authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Query the users table directly to check role
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = user_id;
  
  -- Return true if user role is SUPER_ADMIN  
  RETURN COALESCE(user_role = 'SUPER_ADMIN', false);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;