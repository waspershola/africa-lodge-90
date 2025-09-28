-- Create missing folios for checked-in reservations
INSERT INTO folios (
  tenant_id,
  reservation_id,
  folio_number,
  status,
  total_charges,
  total_payments
)
SELECT 
  r.tenant_id,
  r.id,
  'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(r.id::text, 6, '0'),
  'open',
  r.total_amount,
  0
FROM reservations r
WHERE r.id IN ('02ec6f8c-cd0a-4dce-a3a4-86dd1fa65712', 'ff381cb1-0050-4b31-a783-65da7dbeb239')
  AND NOT EXISTS (SELECT 1 FROM folios f WHERE f.reservation_id = r.id);

-- Add room charges to the newly created folios
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
WHERE r.id IN ('02ec6f8c-cd0a-4dce-a3a4-86dd1fa65712', 'ff381cb1-0050-4b31-a783-65da7dbeb239')
  AND NOT EXISTS (
    SELECT 1 FROM folio_charges fc 
    WHERE fc.folio_id = f.id AND fc.charge_type = 'room'
  );