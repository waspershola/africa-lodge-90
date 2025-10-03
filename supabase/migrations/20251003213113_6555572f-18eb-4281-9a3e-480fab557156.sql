-- Fix "column tax does not exist" error during checkout
-- Drop obsolete calculate_folio_balance() function that references removed tax columns

-- Drop the obsolete function that tries to access folios.tax_rate and folios.tax_amount
DROP FUNCTION IF EXISTS public.calculate_folio_balance() CASCADE;

-- Audit log entry
INSERT INTO public.audit_log (
  action,
  resource_type,
  description,
  metadata
) VALUES (
  'DATABASE_CLEANUP',
  'FUNCTION',
  'Removed obsolete calculate_folio_balance() function',
  jsonb_build_object(
    'reason', 'Function referenced non-existent tax_rate and tax_amount columns',
    'impact', 'Fixes "column tax does not exist" error during checkout',
    'replaced_by', 'Balance is now auto-calculated via generated column in folios table',
    'migration_date', NOW()
  )
);