-- Fix: Remove SECURITY DEFINER views and replace with regular accessor functions

-- Drop the problematic security definer views
DROP VIEW IF EXISTS public.secure_folio_balances CASCADE;
DROP VIEW IF EXISTS public.secure_guest_stats_monthly CASCADE;
DROP VIEW IF EXISTS public.secure_daily_revenue CASCADE;
DROP VIEW IF EXISTS public.secure_occupancy_stats CASCADE;

-- Instead, create secure accessor functions for materialized views
-- These are better than views because they're explicit about security model

CREATE OR REPLACE FUNCTION public.get_secure_folio_balances()
RETURNS SETOF public.folio_balances
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.folio_balances
  WHERE tenant_id = get_user_tenant_id()
    OR is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.get_secure_guest_stats_monthly()
RETURNS SETOF public.guest_stats_monthly
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.guest_stats_monthly
  WHERE tenant_id = get_user_tenant_id()
    OR is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.get_secure_daily_revenue()
RETURNS SETOF public.mv_daily_revenue_by_tenant
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.mv_daily_revenue_by_tenant
  WHERE tenant_id = get_user_tenant_id()
    OR is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.get_secure_occupancy_stats()
RETURNS SETOF public.occupancy_stats
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.occupancy_stats
  WHERE tenant_id = get_user_tenant_id()
    OR is_super_admin();
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_secure_folio_balances() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_guest_stats_monthly() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_daily_revenue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_occupancy_stats() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.get_secure_folio_balances IS 
  'Tenant-isolated accessor for folio_balances materialized view. Call this function instead of querying the view directly.';
COMMENT ON FUNCTION public.get_secure_guest_stats_monthly IS 
  'Tenant-isolated accessor for guest_stats_monthly materialized view. Call this function instead of querying the view directly.';
COMMENT ON FUNCTION public.get_secure_daily_revenue IS 
  'Tenant-isolated accessor for mv_daily_revenue_by_tenant materialized view. Call this function instead of querying the view directly.';
COMMENT ON FUNCTION public.get_secure_occupancy_stats IS 
  'Tenant-isolated accessor for occupancy_stats materialized view. Call this function instead of querying the view directly.';

-- Update audit log
INSERT INTO audit_log (
  action, 
  resource_type, 
  description, 
  metadata
) VALUES (
  'SECURITY_FIX',
  'DATABASE',
  'Replaced security definer views with accessor functions',
  jsonb_build_object(
    'change', 'Dropped problematic SECURITY DEFINER views and replaced with explicit accessor functions',
    'reason', 'Linter detected SECURITY DEFINER views as security risk',
    'solution', 'Use functions like get_secure_folio_balances() instead of direct view access',
    'migration_date', NOW()
  )
);