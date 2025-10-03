-- Step 4: Drop deprecated tax columns from folios table
-- These columns caused double-taxation bugs and are replaced by 
-- component-based calculations from folio_charges

COMMENT ON COLUMN folios.total_charges IS 
'Total of all charges including base amount, VAT, and service charges. Calculated from folio_charges components.';

-- Drop the deprecated columns
ALTER TABLE folios DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE folios DROP COLUMN IF EXISTS tax_rate;

-- Add audit log
INSERT INTO audit_log (
  action,
  resource_type,
  description,
  metadata
) VALUES (
  'SCHEMA_MIGRATION',
  'FOLIO',
  'Removed deprecated tax_amount and tax_rate columns to prevent double-taxation',
  jsonb_build_object(
    'reason', 'Tax breakdown now calculated from folio_charges components',
    'migration_date', now()
  )
);