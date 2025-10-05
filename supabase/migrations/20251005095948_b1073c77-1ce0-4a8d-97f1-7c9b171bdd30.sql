-- Create professional room type availability function
CREATE OR REPLACE FUNCTION get_room_type_availability(
  p_tenant_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE
)
RETURNS TABLE (
  room_type_id UUID,
  room_type_name TEXT,
  total_inventory BIGINT,
  available_count BIGINT,
  reserved_count BIGINT,
  blocked_count BIGINT,
  can_book BOOLEAN,
  availability_status TEXT,
  base_rate NUMERIC,
  max_occupancy INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH room_type_inventory AS (
    SELECT 
      rt.id as room_type_id,
      rt.name as room_type_name,
      COUNT(r.id) as total_inventory,
      rt.base_rate,
      rt.max_occupancy
    FROM room_types rt
    LEFT JOIN rooms r ON r.room_type_id = rt.id 
    WHERE rt.tenant_id = p_tenant_id
      AND (r.status IS NULL OR r.status NOT IN ('out_of_order'))
    GROUP BY rt.id, rt.name, rt.base_rate, rt.max_occupancy
  ),
  reserved_rooms AS (
    SELECT 
      r.room_type_id,
      COUNT(DISTINCT res.room_id) as reserved_count
    FROM reservations res
    JOIN rooms r ON r.id = res.room_id
    WHERE res.tenant_id = p_tenant_id
      AND res.status IN ('confirmed', 'checked_in')
      AND res.check_in_date < p_check_out_date
      AND res.check_out_date > p_check_in_date
    GROUP BY r.room_type_id
  ),
  blocked_rooms AS (
    SELECT 
      room_type_id,
      COUNT(*) as blocked_count
    FROM rooms
    WHERE tenant_id = p_tenant_id
      AND status IN ('maintenance', 'out_of_order')
    GROUP BY room_type_id
  )
  SELECT 
    rti.room_type_id,
    rti.room_type_name,
    rti.total_inventory,
    (rti.total_inventory - COALESCE(rr.reserved_count, 0) - COALESCE(br.blocked_count, 0)) as available_count,
    COALESCE(rr.reserved_count, 0) as reserved_count,
    COALESCE(br.blocked_count, 0) as blocked_count,
    (rti.total_inventory - COALESCE(rr.reserved_count, 0) - COALESCE(br.blocked_count, 0)) > 0 as can_book,
    CASE 
      WHEN (rti.total_inventory - COALESCE(rr.reserved_count, 0) - COALESCE(br.blocked_count, 0)) > 5 THEN 'available'
      WHEN (rti.total_inventory - COALESCE(rr.reserved_count, 0) - COALESCE(br.blocked_count, 0)) BETWEEN 1 AND 5 THEN 'limited'
      WHEN (rti.total_inventory - COALESCE(rr.reserved_count, 0) - COALESCE(br.blocked_count, 0)) = 0 THEN 'sold_out'
      ELSE 'on_request'
    END as availability_status,
    rti.base_rate,
    rti.max_occupancy
  FROM room_type_inventory rti
  LEFT JOIN reserved_rooms rr ON rr.room_type_id = rti.room_type_id
  LEFT JOIN blocked_rooms br ON br.room_type_id = rti.room_type_id
  ORDER BY rti.room_type_name;
END;
$$;