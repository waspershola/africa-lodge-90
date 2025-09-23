-- Identify and fix any remaining security definer views
-- Check if mv_daily_revenue_by_tenant has security definer and fix it

-- Recreate mv_daily_revenue_by_tenant without security definer
DROP MATERIALIZED VIEW IF EXISTS mv_daily_revenue_by_tenant CASCADE;

CREATE MATERIALIZED VIEW mv_daily_revenue_by_tenant AS
SELECT 
  r.tenant_id,
  DATE(r.created_at) as revenue_date,
  SUM(r.total_amount) as total_revenue,
  COUNT(r.id) as reservation_count,
  AVG(r.total_amount) as avg_revenue_per_reservation,
  COUNT(DISTINCT r.guest_id) as unique_guests
FROM reservations r
WHERE r.status IN ('confirmed', 'checked_in', 'checked_out')
  AND r.created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY r.tenant_id, DATE(r.created_at);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mv_daily_revenue_tenant_date ON mv_daily_revenue_by_tenant(tenant_id, revenue_date);

-- Secure access to this view
REVOKE ALL ON mv_daily_revenue_by_tenant FROM PUBLIC;
REVOKE ALL ON mv_daily_revenue_by_tenant FROM anon, authenticated;
GRANT SELECT ON mv_daily_revenue_by_tenant TO service_role;

-- Create a secure function to access daily revenue data
CREATE OR REPLACE FUNCTION public.get_daily_revenue(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
  revenue_date DATE,
  total_revenue NUMERIC,
  reservation_count BIGINT,
  avg_revenue_per_reservation NUMERIC,
  unique_guests BIGINT
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
    dr.revenue_date,
    dr.total_revenue,
    dr.reservation_count,
    dr.avg_revenue_per_reservation,
    dr.unique_guests
  FROM mv_daily_revenue_by_tenant dr
  WHERE dr.tenant_id = p_tenant_id
    AND dr.revenue_date BETWEEN p_start_date AND p_end_date
  ORDER BY dr.revenue_date;
END;
$$;