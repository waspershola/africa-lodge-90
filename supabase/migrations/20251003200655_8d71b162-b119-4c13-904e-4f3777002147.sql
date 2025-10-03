-- Fix Room 102 double-tax bug and add audit trail
-- This corrects the folio charges that were created with double-taxed amounts

-- Step 1: Correct the folio_charges for Room 102
-- Original incorrect: base 208415.63 (which was already taxed)
-- Correct: base 150000.00 (1 night * 150000 rate)
UPDATE folio_charges
SET 
  base_amount = 150000.00,
  service_charge_amount = 15000.00,  -- 10% of base
  vat_amount = 12375.00,              -- 7.5% of (base + service)
  amount = 177375.00                  -- Total
WHERE id = 'c32ddc87-6072-4a98-b9c0-332ebfd570f0'
  AND folio_id = 'c2f6d690-efe3-4d1e-9e34-0ece0a67b816';

-- Step 2: Recalculate folio totals
UPDATE folios
SET 
  total_charges = 177375.00,
  updated_at = NOW()
WHERE id = 'c2f6d690-efe3-4d1e-9e34-0ece0a67b816';

-- Step 3: Add audit trail
INSERT INTO audit_log (
  action, 
  resource_type, 
  resource_id, 
  tenant_id,
  description, 
  metadata,
  actor_id
) VALUES (
  'FOLIO_MANUAL_CORRECTION',
  'FOLIO',
  'c2f6d690-efe3-4d1e-9e34-0ece0a67b816',
  'f8a5215e-1730-48f9-869c-3c53e432433c',
  'Corrected double-tax bug on walk-in check-in charge for Room 102',
  jsonb_build_object(
    'old_base_amount', 208415.63,
    'new_base_amount', 150000.00,
    'old_total', 224046.80,
    'new_total', 177375.00,
    'correction_reason', 'Double tax application bug - frontend passed total with taxes as base amount',
    'affected_charge_id', 'c32ddc87-6072-4a98-b9c0-332ebfd570f0',
    'room_number', '102',
    'guest_name', 'rofia rofiat'
  ),
  get_user_id()
);