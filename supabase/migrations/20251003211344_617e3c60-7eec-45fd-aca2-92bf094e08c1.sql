-- Security Hardening: Fix linter warnings where possible via SQL

-- ============================================================
-- FIX 1: Add search_path to custom functions without it
-- ============================================================

-- Fix map_payment_method_canonical function
CREATE OR REPLACE FUNCTION public.map_payment_method_canonical(p_method_type text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN CASE 
    WHEN p_method_type IN ('cash', 'CASH', 'Cash') THEN 'cash'
    WHEN p_method_type IN ('card', 'CARD', 'Card', 'credit_card', 'debit_card') THEN 'card'
    WHEN p_method_type IN ('transfer', 'TRANSFER', 'bank_transfer') THEN 'transfer'
    WHEN p_method_type IN ('mobile', 'MOBILE', 'mobile_money') THEN 'mobile'
    ELSE p_method_type
  END;
END;
$$;

-- Fix prevent_multiple_active_reservations trigger function
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_reservations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent overlapping active reservations for the same room
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE room_id = NEW.room_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('confirmed', 'checked_in')
      AND (
        (NEW.check_in_date >= check_in_date AND NEW.check_in_date < check_out_date) OR
        (NEW.check_out_date > check_in_date AND NEW.check_out_date <= check_out_date) OR
        (NEW.check_in_date <= check_in_date AND NEW.check_out_date >= check_out_date)
      )
  ) THEN
    RAISE EXCEPTION 'Room % already has an active reservation for the specified dates', NEW.room_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 2: Restrict materialized view access via RLS
-- ============================================================

-- Revoke direct SELECT access from materialized views for anon/authenticated roles
REVOKE SELECT ON public.folio_balances FROM anon, authenticated;
REVOKE SELECT ON public.guest_stats_monthly FROM anon, authenticated;
REVOKE SELECT ON public.mv_daily_revenue_by_tenant FROM anon, authenticated;
REVOKE SELECT ON public.occupancy_stats FROM anon, authenticated;

-- Grant SELECT only to authenticated users via RLS-enabled wrapper views
-- Create secure views that enforce tenant isolation

CREATE OR REPLACE VIEW public.secure_folio_balances AS
SELECT * FROM public.folio_balances
WHERE tenant_id = get_user_tenant_id()
  OR is_super_admin();

CREATE OR REPLACE VIEW public.secure_guest_stats_monthly AS
SELECT * FROM public.guest_stats_monthly
WHERE tenant_id = get_user_tenant_id()
  OR is_super_admin();

CREATE OR REPLACE VIEW public.secure_daily_revenue AS
SELECT * FROM public.mv_daily_revenue_by_tenant
WHERE tenant_id = get_user_tenant_id()
  OR is_super_admin();

CREATE OR REPLACE VIEW public.secure_occupancy_stats AS
SELECT * FROM public.occupancy_stats
WHERE tenant_id = get_user_tenant_id()
  OR is_super_admin();

-- Grant access to secure views
GRANT SELECT ON public.secure_folio_balances TO authenticated;
GRANT SELECT ON public.secure_guest_stats_monthly TO authenticated;
GRANT SELECT ON public.secure_daily_revenue TO authenticated;
GRANT SELECT ON public.secure_occupancy_stats TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.secure_folio_balances IS 
  'Tenant-isolated view of folio_balances materialized view. Use this instead of direct access.';
COMMENT ON VIEW public.secure_guest_stats_monthly IS 
  'Tenant-isolated view of guest_stats_monthly materialized view. Use this instead of direct access.';
COMMENT ON VIEW public.secure_daily_revenue IS 
  'Tenant-isolated view of mv_daily_revenue_by_tenant materialized view. Use this instead of direct access.';
COMMENT ON VIEW public.secure_occupancy_stats IS 
  'Tenant-isolated view of occupancy_stats materialized view. Use this instead of direct access.';

-- ============================================================
-- Audit log entry
-- ============================================================

INSERT INTO audit_log (
  action, 
  resource_type, 
  description, 
  metadata
) VALUES (
  'SECURITY_HARDENING',
  'DATABASE',
  'Applied security fixes from linter warnings',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'Added search_path to map_payment_method_canonical',
      'Added search_path to prevent_multiple_active_reservations',
      'Restricted direct access to materialized views',
      'Created tenant-isolated secure views for analytics'
    ],
    'remaining_manual_fixes', ARRAY[
      'Enable leaked password protection in Auth settings',
      'Consider moving pg_trgm extension to extensions schema (complex migration)'
    ],
    'migration_date', NOW()
  )
);

-- ============================================================
-- NOTES FOR MANUAL FIXES (Cannot be done via SQL):
-- ============================================================

-- 1. LEAKED PASSWORD PROTECTION (WARN 6):
--    Go to Supabase Dashboard > Authentication > Policies
--    Enable "Password Strength" and "Leaked Password Protection"
--    Link: https://supabase.com/docs/guides/auth/password-security

-- 2. EXTENSION IN PUBLIC SCHEMA (WARN 4):
--    The pg_trgm extension is in public schema
--    Moving it requires complex migration and could break existing queries
--    This is a common setup and low-risk warning
--    If needed, create new schema 'extensions' and move extension there