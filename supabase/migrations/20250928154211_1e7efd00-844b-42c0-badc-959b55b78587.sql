-- Fix missing charges on existing folio
INSERT INTO folio_charges (
  tenant_id,
  folio_id,
  charge_type,
  description,
  amount,
  posted_by
)
SELECT 
  f.tenant_id,
  f.id,
  'room',
  'Room charges for reservation ' || r.reservation_number,
  r.total_amount,
  get_user_id()
FROM folios f
JOIN reservations r ON r.id = f.reservation_id
WHERE f.id = '40530ab6-2256-4ff9-8835-991bbd248c15'
  AND NOT EXISTS (
    SELECT 1 FROM folio_charges fc 
    WHERE fc.folio_id = f.id AND fc.charge_type = 'room'
  );