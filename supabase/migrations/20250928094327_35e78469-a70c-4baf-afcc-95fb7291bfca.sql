-- Clean up data inconsistencies first
-- Update room status to match reservation status for consistency
UPDATE rooms SET status = 'occupied' 
WHERE id IN (
  SELECT DISTINCT r.id 
  FROM rooms r 
  JOIN reservations res ON res.room_id = r.id 
  WHERE res.status = 'checked_in' 
    AND r.status != 'occupied'
    AND res.tenant_id = r.tenant_id
);

-- Update reservation status to match room status where needed  
UPDATE reservations SET status = 'confirmed'
WHERE status = 'checked_in' 
  AND room_id IN (
    SELECT id FROM rooms WHERE status = 'reserved'
  );