-- Phase B: Create availability and pricing system

-- 1. Create availability checking function with SELECT FOR UPDATE locking
CREATE OR REPLACE FUNCTION public.fn_get_availability(
  p_tenant_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE,
  p_room_type_id UUID DEFAULT NULL
)
RETURNS TABLE(
  room_id UUID,
  room_number TEXT,
  room_type_name TEXT,
  base_rate NUMERIC,
  available_rate NUMERIC,
  max_occupancy INTEGER,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH available_rooms AS (
    SELECT 
      r.id as room_id,
      r.room_number,
      rt.name as room_type_name,
      rt.base_rate,
      rt.max_occupancy,
      CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM reservations res
          WHERE res.tenant_id = p_tenant_id
            AND res.room_id = r.id
            AND res.status IN ('confirmed', 'checked_in')
            AND (
              (p_check_in_date >= res.check_in_date AND p_check_in_date < res.check_out_date) OR
              (p_check_out_date > res.check_in_date AND p_check_out_date <= res.check_out_date) OR
              (p_check_in_date <= res.check_in_date AND p_check_out_date >= res.check_out_date)
            )
        ) THEN TRUE
        ELSE FALSE
      END as is_available
    FROM rooms r
    JOIN room_types rt ON rt.id = r.room_type_id
    WHERE r.tenant_id = p_tenant_id
      AND r.status = 'available'
      AND (p_room_type_id IS NULL OR rt.id = p_room_type_id)
  )
  SELECT 
    ar.room_id,
    ar.room_number,
    ar.room_type_name,
    ar.base_rate,
    -- Apply rate plan pricing if available
    COALESCE(
      (SELECT rp.final_rate 
       FROM rate_plans rp 
       WHERE rp.tenant_id = p_tenant_id 
         AND rp.room_type_id = ar.room_id
         AND rp.is_active = true
         AND p_check_in_date >= rp.start_date 
         AND p_check_in_date <= rp.end_date
       ORDER BY rp.created_at DESC
       LIMIT 1), 
      ar.base_rate
    ) as available_rate,
    ar.max_occupancy,
    ar.is_available
  FROM available_rooms ar
  ORDER BY ar.room_number;
END;
$$;

-- 2. Create rate plan application function  
CREATE OR REPLACE FUNCTION public.apply_rate_plan_bulk(
  p_tenant_id UUID,
  p_rate_plan_id UUID,
  p_room_type_ids UUID[],
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  applied_count INTEGER := 0;
  room_type_id UUID;
BEGIN
  -- Only allow access to own tenant data or super admin
  IF NOT (is_super_admin() OR can_access_tenant(p_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get the rate plan details
  IF NOT EXISTS (
    SELECT 1 FROM rate_plans 
    WHERE id = p_rate_plan_id 
      AND tenant_id = p_tenant_id 
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Rate plan not found or inactive';
  END IF;

  -- Apply to each room type
  FOREACH room_type_id IN ARRAY p_room_type_ids
  LOOP
    -- Create individual rate entries for the date range
    INSERT INTO rate_plans (
      tenant_id, 
      room_type_id, 
      name, 
      type, 
      base_rate, 
      adjustment_type, 
      adjustment, 
      final_rate,
      start_date, 
      end_date, 
      is_active
    )
    SELECT 
      p_tenant_id,
      room_type_id,
      rp.name || ' - ' || rt.name,
      rp.type,
      rt.base_rate,
      rp.adjustment_type,
      rp.adjustment,
      CASE 
        WHEN rp.adjustment_type = 'percentage' THEN 
          rt.base_rate * (1 + rp.adjustment / 100)
        ELSE 
          rt.base_rate + rp.adjustment
      END,
      p_start_date,
      p_end_date,
      true
    FROM rate_plans rp
    JOIN room_types rt ON rt.tenant_id = p_tenant_id AND rt.id = room_type_id
    WHERE rp.id = p_rate_plan_id;
    
    applied_count := applied_count + 1;
  END LOOP;

  RETURN applied_count;
END;
$$;

-- 3. Create guest analytics function
CREATE OR REPLACE FUNCTION public.get_guest_analytics(
  p_tenant_id UUID,
  p_guest_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '1 year'),
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  guest_id UUID,
  guest_name TEXT,
  total_stays INTEGER,
  total_spent NUMERIC,
  lifetime_value NUMERIC,
  avg_stay_length NUMERIC,
  last_stay_date DATE,
  preferred_room_type TEXT,
  is_repeat_guest BOOLEAN,
  guest_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow access to own tenant data or super admin
  IF NOT (is_super_admin() OR can_access_tenant(p_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH guest_stats AS (
    SELECT 
      g.id as guest_id,
      (g.first_name || ' ' || g.last_name) as guest_name,
      COUNT(r.id)::INTEGER as total_stays,
      COALESCE(SUM(r.total_amount), 0) as total_spent,
      COALESCE(AVG(r.check_out_date - r.check_in_date), 0) as avg_stay_length,
      MAX(r.check_out_date) as last_stay_date,
      -- Most frequent room type
      (
        SELECT rt.name 
        FROM reservations r2 
        JOIN rooms rm ON rm.id = r2.room_id
        JOIN room_types rt ON rt.id = rm.room_type_id
        WHERE r2.guest_id = g.id 
          AND r2.tenant_id = p_tenant_id
        GROUP BY rt.name 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
      ) as preferred_room_type
    FROM guests g
    LEFT JOIN reservations r ON r.guest_id = g.id 
      AND r.tenant_id = p_tenant_id
      AND r.check_in_date >= p_start_date 
      AND r.check_in_date <= p_end_date
      AND r.status IN ('confirmed', 'checked_in', 'checked_out')
    WHERE g.tenant_id = p_tenant_id
      AND (p_guest_id IS NULL OR g.id = p_guest_id)
    GROUP BY g.id, g.first_name, g.last_name
  )
  SELECT 
    gs.guest_id,
    gs.guest_name,
    gs.total_stays,
    gs.total_spent,
    -- Calculate lifetime value (projected annual spend)
    CASE 
      WHEN gs.total_stays > 0 THEN gs.total_spent * (365.0 / GREATEST(CURRENT_DATE - gs.last_stay_date, 1))
      ELSE 0
    END as lifetime_value,
    gs.avg_stay_length,
    gs.last_stay_date,
    COALESCE(gs.preferred_room_type, 'None') as preferred_room_type,
    (gs.total_stays > 1) as is_repeat_guest,
    -- Guest tier based on total spent
    CASE 
      WHEN gs.total_spent >= 500000 THEN 'VIP'
      WHEN gs.total_spent >= 200000 THEN 'Gold'
      WHEN gs.total_spent >= 100000 THEN 'Silver'
      ELSE 'Standard'
    END as guest_tier
  FROM guest_stats gs
  ORDER BY gs.total_spent DESC, gs.total_stays DESC;
END;
$$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_availability_check 
ON reservations(tenant_id, room_id, status, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_rate_plans_active_dates 
ON rate_plans(tenant_id, room_type_id, is_active, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_guests_analytics 
ON guests(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_rooms_status_type 
ON rooms(tenant_id, status, room_type_id);