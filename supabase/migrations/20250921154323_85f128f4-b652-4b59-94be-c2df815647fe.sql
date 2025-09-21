-- Fix function search path security issue
-- Set search_path for all custom functions to be immutable and secure

-- Update prevent_platform_owner_changes function with proper search_path
CREATE OR REPLACE FUNCTION prevent_platform_owner_changes() 
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.is_platform_owner = true AND (
    TG_OP = 'DELETE' OR 
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.is_platform_owner IS DISTINCT FROM OLD.is_platform_owner
  ) THEN
    RAISE EXCEPTION 'Platform owner cannot be deleted, have role changed, or lose platform owner status';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;