-- Add room availability checking function
CREATE OR REPLACE FUNCTION public.check_room_availability(
  p_tenant_id UUID,
  p_room_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE,
  p_exclude_reservation_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if room exists and is not out of order
  IF NOT EXISTS (
    SELECT 1 FROM rooms 
    WHERE id = p_room_id 
      AND tenant_id = p_tenant_id 
      AND status != 'out_of_order'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check for conflicting reservations
  IF EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.tenant_id = p_tenant_id
      AND r.room_id = p_room_id
      AND r.status IN ('confirmed', 'checked_in')
      AND (r.id != p_exclude_reservation_id OR p_exclude_reservation_id IS NULL)
      AND (
        (p_check_in_date >= r.check_in_date AND p_check_in_date < r.check_out_date) OR
        (p_check_out_date > r.check_in_date AND p_check_out_date <= r.check_out_date) OR
        (p_check_in_date <= r.check_in_date AND p_check_out_date >= r.check_out_date)
      )
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add function to get available rooms for date range
CREATE OR REPLACE FUNCTION public.get_available_rooms(
  p_tenant_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE,
  p_room_type_id UUID DEFAULT NULL
) RETURNS TABLE(
  room_id UUID,
  room_number TEXT,
  room_type_name TEXT,
  base_rate NUMERIC,
  max_occupancy INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as room_id,
    r.room_number,
    rt.name as room_type_name,
    rt.base_rate,
    rt.max_occupancy
  FROM rooms r
  JOIN room_types rt ON rt.id = r.room_type_id
  WHERE r.tenant_id = p_tenant_id
    AND r.status = 'available'
    AND (p_room_type_id IS NULL OR rt.id = p_room_type_id)
    AND NOT EXISTS (
      SELECT 1 FROM reservations res
      WHERE res.tenant_id = p_tenant_id
        AND res.room_id = r.id
        AND res.status IN ('confirmed', 'checked_in')
        AND (
          (p_check_in_date >= res.check_in_date AND p_check_in_date < res.check_out_date) OR
          (p_check_out_date > res.check_in_date AND p_check_out_date <= res.check_out_date) OR
          (p_check_in_date <= res.check_in_date AND p_check_out_date >= res.check_out_date)
        )
    )
  ORDER BY r.room_number;
END;
$$;