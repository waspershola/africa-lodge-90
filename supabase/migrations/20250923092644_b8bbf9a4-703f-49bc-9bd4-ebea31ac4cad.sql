-- Fix security issues from linter

-- 1. Fix function search_path issues by updating existing functions
CREATE OR REPLACE FUNCTION public.update_reservation_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reservation total when room rate or dates change
  IF TG_OP = 'UPDATE' THEN
    NEW.total_amount = NEW.room_rate * (NEW.check_out_date - NEW.check_in_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- 2. Secure materialized views by revoking public access
REVOKE ALL ON occupancy_stats FROM PUBLIC;
REVOKE ALL ON occupancy_stats FROM anon, authenticated;

REVOKE ALL ON guest_stats_monthly FROM PUBLIC; 
REVOKE ALL ON guest_stats_monthly FROM anon, authenticated;

REVOKE ALL ON mv_daily_revenue_by_tenant FROM PUBLIC;
REVOKE ALL ON mv_daily_revenue_by_tenant FROM anon, authenticated;

-- 3. Grant selective access to materialized views only to authorized roles
GRANT SELECT ON occupancy_stats TO service_role;
GRANT SELECT ON guest_stats_monthly TO service_role;
GRANT SELECT ON mv_daily_revenue_by_tenant TO service_role;

-- 4. Create RLS policies for materialized views (if they support it)
-- Note: Materialized views don't support RLS directly, so we control access via grants

-- 5. Create secure functions to access materialized view data
CREATE OR REPLACE FUNCTION public.get_occupancy_stats(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '12 months',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
  stat_date DATE,
  occupied_rooms BIGINT,
  total_rooms BIGINT,
  occupancy_rate NUMERIC
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
    os.stat_date,
    os.occupied_rooms,
    os.total_rooms,
    os.occupancy_rate
  FROM occupancy_stats os
  WHERE os.tenant_id = p_tenant_id
    AND os.stat_date BETWEEN p_start_date AND p_end_date
  ORDER BY os.stat_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_guest_stats(
  p_tenant_id UUID,
  p_months_back INTEGER DEFAULT 12
) RETURNS TABLE(
  month_year TIMESTAMP WITH TIME ZONE,
  unique_guests BIGINT,
  total_reservations BIGINT,
  avg_reservation_value NUMERIC,
  total_revenue NUMERIC,
  avg_stay_length NUMERIC,
  repeat_guests BIGINT,
  retention_rate NUMERIC
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
    gs.month_year,
    gs.unique_guests,
    gs.total_reservations,
    gs.avg_reservation_value,
    gs.total_revenue,
    gs.avg_stay_length,
    gs.repeat_guests,
    gs.retention_rate
  FROM guest_stats_monthly gs
  WHERE gs.tenant_id = p_tenant_id
    AND gs.month_year >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
  ORDER BY gs.month_year;
END;
$$;

-- 6. Create function to refresh materialized views securely
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
  REFRESH MATERIALIZED VIEW CONCURRENTLY folio_balances;
END;
$$;

-- 7. Create schedule for automatic materialized view refresh (commented for manual setup)
-- This would typically be set up as a cron job or scheduled task
-- SELECT cron.schedule('refresh-reporting-views', '0 1 * * *', 'SELECT refresh_reporting_views();');