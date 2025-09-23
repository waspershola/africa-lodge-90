-- Phase 2: Revenue & Billing Functions and Views

-- Function to calculate ADR (Average Daily Rate) for a tenant and date range
CREATE OR REPLACE FUNCTION fn_adr(
  tenant_uuid UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_revenue NUMERIC := 0;
  total_occupied_nights INTEGER := 0;
BEGIN
  SELECT 
    COALESCE(SUM(r.total_amount), 0),
    COALESCE(COUNT(*), 0)
  INTO total_revenue, total_occupied_nights
  FROM reservations r
  WHERE r.tenant_id = tenant_uuid
    AND r.status IN ('confirmed', 'checked_in', 'checked_out')
    AND r.check_in_date >= start_date
    AND r.check_out_date <= end_date;
    
  IF total_occupied_nights = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN total_revenue / total_occupied_nights;
END;
$$;

-- Function to calculate RevPAR (Revenue Per Available Room)
CREATE OR REPLACE FUNCTION fn_revpar(
  tenant_uuid UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_revenue NUMERIC := 0;
  total_available_nights INTEGER := 0;
  days_in_period INTEGER;
  total_rooms INTEGER;
BEGIN
  -- Get total rooms for the tenant
  SELECT COUNT(*) INTO total_rooms
  FROM rooms 
  WHERE tenant_id = tenant_uuid 
    AND status != 'out_of_order';
    
  -- Calculate days in period
  days_in_period := end_date - start_date + 1;
  total_available_nights := total_rooms * days_in_period;
  
  -- Get total revenue for the period
  SELECT COALESCE(SUM(r.total_amount), 0)
  INTO total_revenue
  FROM reservations r
  WHERE r.tenant_id = tenant_uuid
    AND r.status IN ('confirmed', 'checked_in', 'checked_out')
    AND r.check_in_date >= start_date
    AND r.check_out_date <= end_date;
    
  IF total_available_nights = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN total_revenue / total_available_nights;
END;
$$;

-- Function to get daily revenue breakdown
CREATE OR REPLACE FUNCTION fn_daily_revenue(
  tenant_uuid UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  revenue_date DATE,
  room_revenue NUMERIC,
  payment_revenue NUMERIC,
  total_revenue NUMERIC,
  occupied_rooms INTEGER,
  available_rooms INTEGER,
  occupancy_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS revenue_date
  ),
  room_totals AS (
    SELECT COUNT(*) as total_rooms
    FROM rooms 
    WHERE tenant_id = tenant_uuid AND status != 'out_of_order'
  )
  SELECT 
    ds.revenue_date,
    COALESCE(SUM(r.total_amount), 0) as room_revenue,
    COALESCE(SUM(p.amount), 0) as payment_revenue,
    COALESCE(SUM(r.total_amount), 0) + COALESCE(SUM(p.amount), 0) as total_revenue,
    COUNT(r.id)::integer as occupied_rooms,
    rt.total_rooms::integer as available_rooms,
    CASE 
      WHEN rt.total_rooms > 0 THEN (COUNT(r.id)::numeric / rt.total_rooms::numeric * 100)
      ELSE 0
    END as occupancy_rate
  FROM date_series ds
  CROSS JOIN room_totals rt
  LEFT JOIN reservations r ON r.tenant_id = tenant_uuid 
    AND r.check_in_date <= ds.revenue_date 
    AND r.check_out_date > ds.revenue_date
    AND r.status IN ('confirmed', 'checked_in', 'checked_out')
  LEFT JOIN folios f ON f.reservation_id = r.id
  LEFT JOIN payments p ON p.folio_id = f.id 
    AND p.status = 'completed'
    AND DATE(p.created_at) = ds.revenue_date
  GROUP BY ds.revenue_date, rt.total_rooms
  ORDER BY ds.revenue_date;
END;
$$;

-- Create materialized view for daily revenue by tenant
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue_by_tenant AS
SELECT 
  r.tenant_id,
  DATE(r.check_in_date) as revenue_date,
  COUNT(r.id) as reservations_count,
  SUM(r.total_amount) as room_revenue,
  AVG(r.total_amount) as avg_room_rate,
  SUM(CASE WHEN r.status = 'checked_out' THEN r.total_amount ELSE 0 END) as completed_revenue
FROM reservations r
WHERE r.check_in_date >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY r.tenant_id, DATE(r.check_in_date);

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_revenue_tenant_date 
ON mv_daily_revenue_by_tenant(tenant_id, revenue_date);

-- Create view for revenue by payment method
CREATE OR REPLACE VIEW revenue_by_payment_method AS
SELECT 
  p.tenant_id,
  p.payment_method,
  DATE(p.created_at) as payment_date,
  COUNT(p.id) as transaction_count,
  SUM(p.amount) as total_amount,
  AVG(p.amount) as avg_transaction_amount
FROM payments p
WHERE p.status = 'completed'
  AND p.created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY p.tenant_id, p.payment_method, DATE(p.created_at);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_revenue_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue_by_tenant;
  REFRESH MATERIALIZED VIEW CONCURRENTLY folio_balances;
END;
$$;

-- Create atomic reservation booking function
CREATE OR REPLACE FUNCTION create_reservation_atomic(
  p_tenant_id UUID,
  p_guest_data JSONB,
  p_reservation_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_id UUID;
  reservation_id UUID;
  folio_id UUID;
  result JSONB;
BEGIN
  -- Create or find guest
  INSERT INTO guests (
    tenant_id, first_name, last_name, email, phone,
    guest_id_number, nationality, address
  ) VALUES (
    p_tenant_id,
    p_guest_data->>'first_name',
    p_guest_data->>'last_name', 
    p_guest_data->>'email',
    p_guest_data->>'phone',
    p_guest_data->>'guest_id_number',
    p_guest_data->>'nationality',
    p_guest_data->>'address'
  )
  ON CONFLICT (tenant_id, email) 
  DO UPDATE SET 
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    updated_at = now()
  RETURNING id INTO guest_id;
  
  -- Create reservation
  INSERT INTO reservations (
    tenant_id, guest_id, guest_name, guest_email, guest_phone,
    room_id, check_in_date, check_out_date, adults, children,
    room_rate, total_amount, reservation_number, status
  ) VALUES (
    p_tenant_id,
    guest_id,
    (p_guest_data->>'first_name') || ' ' || (p_guest_data->>'last_name'),
    p_guest_data->>'email',
    p_guest_data->>'phone',
    (p_reservation_data->>'room_id')::UUID,
    (p_reservation_data->>'check_in_date')::DATE,
    (p_reservation_data->>'check_out_date')::DATE,
    (p_reservation_data->>'adults')::INTEGER,
    (p_reservation_data->>'children')::INTEGER,
    (p_reservation_data->>'room_rate')::NUMERIC,
    (p_reservation_data->>'total_amount')::NUMERIC,
    'RES-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(nextval('reservation_seq')::text, 4, '0'),
    'confirmed'
  ) RETURNING id INTO reservation_id;
  
  -- Create folio
  INSERT INTO folios (
    tenant_id, reservation_id, folio_number, status
  ) VALUES (
    p_tenant_id,
    reservation_id,
    'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(reservation_id::text, 6, '0'),
    'open'
  ) RETURNING id INTO folio_id;
  
  -- Add room charges to folio
  INSERT INTO folio_charges (
    tenant_id, folio_id, charge_type, description, amount
  ) VALUES (
    p_tenant_id,
    folio_id,
    'room',
    'Room charges for reservation',
    (p_reservation_data->>'total_amount')::NUMERIC
  );
  
  result := jsonb_build_object(
    'success', true,
    'guest_id', guest_id,
    'reservation_id', reservation_id,
    'folio_id', folio_id
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create sequence for reservation numbers
CREATE SEQUENCE IF NOT EXISTS reservation_seq START 1;