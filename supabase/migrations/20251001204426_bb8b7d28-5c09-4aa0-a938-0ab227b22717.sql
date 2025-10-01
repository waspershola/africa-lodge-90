-- Fix calculate_reservation_overstay function - incorrect column reference
-- The tenants table uses tenant_id as primary key, not id

CREATE OR REPLACE FUNCTION public.calculate_reservation_overstay(
  p_reservation_id uuid
) RETURNS boolean AS $$
DECLARE
  v_checkout_date date;
  v_checkout_time time := '12:00:00'::time;
  v_hotel_timezone text := 'UTC';
  v_checkout_datetime timestamptz;
  v_now timestamptz;
BEGIN
  -- Get checkout date from reservation
  SELECT check_out_date INTO v_checkout_date
  FROM reservations
  WHERE id = p_reservation_id AND status = 'checked_in';

  IF v_checkout_date IS NULL THEN
    RETURN false;
  END IF;

  -- Get hotel timezone from tenant settings (fallback to UTC)
  -- FIX: Changed t.id to t.tenant_id (correct primary key column)
  SELECT COALESCE(timezone, 'UTC') INTO v_hotel_timezone
  FROM tenants t
  JOIN reservations r ON r.tenant_id = t.tenant_id
  WHERE r.id = p_reservation_id;

  -- Calculate checkout datetime in hotel timezone
  v_checkout_datetime := (v_checkout_date::text || ' ' || v_checkout_time::text)::timestamp 
    AT TIME ZONE v_hotel_timezone;

  -- Get current time in hotel timezone
  v_now := now() AT TIME ZONE v_hotel_timezone;

  -- Return true if current time is past checkout time
  RETURN v_now > v_checkout_datetime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION public.calculate_reservation_overstay IS 
'Calculates if a reservation is overstayed based on hotel timezone and configured checkout time (12:00 PM by default). Fixed: Uses correct tenant_id column instead of non-existent id column.';