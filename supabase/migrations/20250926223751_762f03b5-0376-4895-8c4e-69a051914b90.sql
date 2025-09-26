-- Remove public access from all materialized views to address security concerns
-- These views effectively bypass RLS by executing with postgres user privileges

-- Remove access from folio_balances (already done but ensuring it's complete)
REVOKE ALL ON public.folio_balances FROM anon, authenticated, public;

-- Remove access from guest_stats_monthly
REVOKE ALL ON public.guest_stats_monthly FROM anon, authenticated, public;

-- Remove access from mv_daily_revenue_by_tenant
REVOKE ALL ON public.mv_daily_revenue_by_tenant FROM anon, authenticated, public;

-- Remove access from occupancy_stats
REVOKE ALL ON public.occupancy_stats FROM anon, authenticated, public;

-- Create secure wrapper functions for the other materialized views

-- Secure wrapper for guest_stats_monthly
CREATE OR REPLACE FUNCTION public.get_guest_stats_secure(p_tenant_id uuid, p_months_back integer DEFAULT 12)
RETURNS TABLE(
    month_year timestamp with time zone, 
    unique_guests bigint, 
    total_reservations bigint, 
    avg_reservation_value numeric, 
    total_revenue numeric, 
    avg_stay_length numeric, 
    repeat_guests bigint, 
    retention_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  FROM public.guest_stats_monthly gs
  WHERE gs.tenant_id = p_tenant_id
    AND gs.month_year >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
  ORDER BY gs.month_year;
END;
$function$;

-- Secure wrapper for occupancy_stats
CREATE OR REPLACE FUNCTION public.get_occupancy_stats_secure(p_tenant_id uuid, p_start_date date DEFAULT (CURRENT_DATE - '1 year'::interval), p_end_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(
    stat_date date, 
    occupied_rooms bigint, 
    total_rooms bigint, 
    occupancy_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  FROM public.occupancy_stats os
  WHERE os.tenant_id = p_tenant_id
    AND os.stat_date BETWEEN p_start_date AND p_end_date
  ORDER BY os.stat_date;
END;
$function$;