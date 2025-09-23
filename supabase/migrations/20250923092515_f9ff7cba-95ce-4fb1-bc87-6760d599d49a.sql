-- Phase 3: Security Fixes
-- Fix plans table RLS policy to prevent permission errors
DROP POLICY IF EXISTS "Only authenticated users can view plans" ON plans;
DROP POLICY IF EXISTS "Super admin can manage plans" ON plans;
DROP POLICY IF EXISTS "Block anonymous access to plans" ON plans;

-- Create proper RLS policies for plans table
CREATE POLICY "authenticated_users_can_view_plans" 
ON plans FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "super_admin_full_access_plans" 
ON plans FOR ALL 
USING (is_super_admin());

-- Fix feature_flags table access
DROP POLICY IF EXISTS "Only authenticated users can view feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Super admin can manage feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Block anonymous access to feature_flags" ON feature_flags;

CREATE POLICY "authenticated_users_can_view_feature_flags" 
ON feature_flags FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "super_admin_full_access_feature_flags" 
ON feature_flags FOR ALL 
USING (is_super_admin());

-- Create materialized views for reporting
CREATE MATERIALIZED VIEW IF NOT EXISTS public.occupancy_stats AS
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '12 months',
    CURRENT_DATE,
    '1 day'::interval
  )::date AS stat_date
),
daily_occupancy AS (
  SELECT 
    t.tenant_id,
    ds.stat_date,
    COUNT(DISTINCT r.id) as occupied_rooms,
    (SELECT COUNT(*) FROM rooms rm WHERE rm.tenant_id = t.tenant_id AND rm.status != 'out_of_order') as total_rooms
  FROM tenants t
  CROSS JOIN date_series ds
  LEFT JOIN reservations r ON r.tenant_id = t.tenant_id 
    AND r.check_in_date <= ds.stat_date 
    AND r.check_out_date > ds.stat_date
    AND r.status IN ('confirmed', 'checked_in', 'checked_out')
  GROUP BY t.tenant_id, ds.stat_date
)
SELECT 
  tenant_id,
  stat_date,
  occupied_rooms,
  total_rooms,
  CASE 
    WHEN total_rooms > 0 THEN (occupied_rooms::numeric / total_rooms::numeric) * 100
    ELSE 0
  END as occupancy_rate,
  DATE_TRUNC('month', stat_date) as month_year,
  DATE_TRUNC('week', stat_date) as week_start
FROM daily_occupancy;

-- Create indexes for occupancy_stats
CREATE INDEX IF NOT EXISTS idx_occupancy_stats_tenant_date ON occupancy_stats(tenant_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_occupancy_stats_month ON occupancy_stats(tenant_id, month_year);

-- Create guest statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.guest_stats_monthly AS
WITH monthly_guest_data AS (
  SELECT 
    r.tenant_id,
    DATE_TRUNC('month', r.created_at) as month_year,
    COUNT(DISTINCT r.guest_id) as unique_guests,
    COUNT(r.id) as total_reservations,
    AVG(r.total_amount) as avg_reservation_value,
    SUM(r.total_amount) as total_revenue,
    AVG(r.check_out_date - r.check_in_date) as avg_stay_length
  FROM reservations r
  WHERE r.status IN ('confirmed', 'checked_in', 'checked_out')
    AND r.created_at >= CURRENT_DATE - INTERVAL '24 months'
  GROUP BY r.tenant_id, DATE_TRUNC('month', r.created_at)
),
guest_retention AS (
  SELECT 
    r.tenant_id,
    DATE_TRUNC('month', r.created_at) as month_year,
    COUNT(DISTINCT CASE WHEN g.total_stays > 1 THEN r.guest_id END) as repeat_guests
  FROM reservations r
  LEFT JOIN guests g ON g.id = r.guest_id AND g.tenant_id = r.tenant_id
  WHERE r.status IN ('confirmed', 'checked_in', 'checked_out')
    AND r.created_at >= CURRENT_DATE - INTERVAL '24 months'
  GROUP BY r.tenant_id, DATE_TRUNC('month', r.created_at)
)
SELECT 
  mgd.tenant_id,
  mgd.month_year,
  mgd.unique_guests,
  mgd.total_reservations,
  mgd.avg_reservation_value,
  mgd.total_revenue,
  mgd.avg_stay_length,
  COALESCE(gr.repeat_guests, 0) as repeat_guests,
  CASE 
    WHEN mgd.unique_guests > 0 THEN (COALESCE(gr.repeat_guests, 0)::numeric / mgd.unique_guests::numeric) * 100
    ELSE 0
  END as retention_rate
FROM monthly_guest_data mgd
LEFT JOIN guest_retention gr ON gr.tenant_id = mgd.tenant_id AND gr.month_year = mgd.month_year;

-- Create indexes for guest_stats_monthly  
CREATE INDEX IF NOT EXISTS idx_guest_stats_tenant_month ON guest_stats_monthly(tenant_id, month_year);

-- Performance: Add triggers to denormalize totals on folios
CREATE OR REPLACE FUNCTION public.update_folio_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update folio totals when charges change
  UPDATE folios SET
    total_charges = COALESCE((
      SELECT SUM(amount) FROM folio_charges 
      WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
  
  -- Calculate and update balance
  UPDATE folios SET
    balance = total_charges - total_payments,
    updated_at = now()
  WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for folio_charges
DROP TRIGGER IF EXISTS trigger_update_folio_totals_charges ON folio_charges;
CREATE TRIGGER trigger_update_folio_totals_charges
  AFTER INSERT OR UPDATE OR DELETE ON folio_charges
  FOR EACH ROW EXECUTE FUNCTION update_folio_totals();

-- Performance: Add trigger for payments
CREATE OR REPLACE FUNCTION public.update_folio_payments()
RETURNS TRIGGER AS $$
BEGIN
  -- Update folio payment totals when payments change
  UPDATE folios SET
    total_payments = COALESCE((
      SELECT SUM(amount) FROM payments 
      WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
      AND status = 'completed'
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
  
  -- Calculate and update balance
  UPDATE folios SET
    balance = total_charges - total_payments,
    updated_at = now()
  WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for payments
DROP TRIGGER IF EXISTS trigger_update_folio_payments ON payments;
CREATE TRIGGER trigger_update_folio_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_folio_payments();

-- Performance: Add trigger to update reservation totals
CREATE OR REPLACE FUNCTION public.update_reservation_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reservation total when room rate or dates change
  IF TG_OP = 'UPDATE' THEN
    NEW.total_amount = NEW.room_rate * (NEW.check_out_date - NEW.check_in_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reservation_totals ON reservations;
CREATE TRIGGER trigger_update_reservation_totals
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_reservation_totals();