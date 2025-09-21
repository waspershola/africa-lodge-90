-- CRITICAL SECURITY FIX: Remove public access and secure sensitive tables

-- First, revoke any existing public permissions
REVOKE ALL ON TABLE public.roles FROM public;
REVOKE ALL ON TABLE public.permissions FROM public; 
REVOKE ALL ON TABLE public.role_permissions FROM public;
REVOKE ALL ON TABLE public.feature_flags FROM public;
REVOKE ALL ON TABLE public.plans FROM public;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Everyone can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Everyone can view plans" ON public.plans;
DROP POLICY IF EXISTS "Everyone can view feature flags" ON public.feature_flags;

-- Create secure policies - authenticated users only
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view plans" ON public.plans
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view feature flags" ON public.feature_flags
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Add is_platform_owner column for immutable super admin protection
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_owner boolean DEFAULT false;

-- Set platform owner for wasperstore@gmail.com (run once)
UPDATE public.users SET is_platform_owner = true WHERE email = 'wasperstore@gmail.com';

-- Create function to prevent platform owner changes
CREATE OR REPLACE FUNCTION prevent_platform_owner_changes() 
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to protect platform owner
DROP TRIGGER IF EXISTS trg_protect_platform_owner ON public.users;
CREATE TRIGGER trg_protect_platform_owner
  BEFORE DELETE OR UPDATE ON public.users
  FOR EACH ROW 
  WHEN (OLD.is_platform_owner = true)
  EXECUTE FUNCTION prevent_platform_owner_changes();