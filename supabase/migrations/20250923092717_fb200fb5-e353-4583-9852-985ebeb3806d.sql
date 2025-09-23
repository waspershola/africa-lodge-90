-- Fix remaining security definer view issue
-- The folio_balances view likely has SECURITY DEFINER, let's remove it and create a secure function instead

-- Drop the existing folio_balances view if it exists
DROP MATERIALIZED VIEW IF EXISTS folio_balances;

-- Create a secure function to get folio balances instead
CREATE OR REPLACE FUNCTION public.get_folio_balances(
  p_tenant_id UUID,
  p_status TEXT DEFAULT 'all'
) RETURNS TABLE(
  folio_id UUID,
  folio_number TEXT,
  reservation_id UUID,
  guest_name TEXT,
  room_number TEXT,
  total_charges NUMERIC,
  total_payments NUMERIC,
  balance NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access to own tenant data or super admin
  IF NOT (is_super_admin() OR can_access_tenant(p_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    f.id as folio_id,
    f.folio_number,
    f.reservation_id,
    r.guest_name,
    rm.room_number,
    COALESCE(f.total_charges, 0) as total_charges,
    COALESCE(f.total_payments, 0) as total_payments,
    COALESCE(f.balance, 0) as balance,
    f.status,
    f.created_at
  FROM folios f
  JOIN reservations r ON r.id = f.reservation_id
  JOIN rooms rm ON rm.id = r.room_id
  WHERE f.tenant_id = p_tenant_id
    AND (p_status = 'all' OR f.status = p_status)
  ORDER BY f.created_at DESC;
END;
$$;

-- Update the refresh function to not include folio_balances
CREATE OR REPLACE FUNCTION public.refresh_reporting_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admin can refresh views
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied - admin only';
  END IF;
  
  REFRESH MATERIALIZED VIEW CONCURRENTLY occupancy_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY guest_stats_monthly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue_by_tenant;
END;
$$;