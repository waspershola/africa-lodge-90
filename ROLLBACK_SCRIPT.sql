-- ============================================================================
-- ROLLBACK SCRIPT for Comprehensive Fix V2
-- Run this script to revert all changes from the October 2, 2025 migration
-- ============================================================================

-- STEP 1: Remove cancellation tracking columns from reservations
ALTER TABLE public.reservations 
  DROP COLUMN IF EXISTS cancelled_at CASCADE,
  DROP COLUMN IF EXISTS cancelled_by CASCADE,
  DROP COLUMN IF EXISTS cancellation_reason CASCADE,
  DROP COLUMN IF EXISTS refund_amount CASCADE,
  DROP COLUMN IF EXISTS cancellation_notes CASCADE;

-- STEP 2: Remove new functions
DROP FUNCTION IF EXISTS public.atomic_checkout_v3(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.map_payment_method_canonical(text) CASCADE;

-- STEP 3: Remove payment trigger
DROP TRIGGER IF EXISTS trg_update_folio_on_payment ON public.payments;
DROP FUNCTION IF EXISTS public.update_folio_on_payment_change() CASCADE;

-- STEP 4: Note about restoring old cancel_reservation_atomic
-- The old cancel_reservation_atomic function was dropped and replaced.
-- If you need to restore it, you must have a backup of the original function definition.
-- The current implementation properly releases rooms, which is the correct behavior.
-- Only rollback if you specifically need the old (broken) behavior.

-- STEP 5: Clean up audit log entries (optional)
-- DELETE FROM public.audit_log 
-- WHERE action = 'SYSTEM_MIGRATION' 
--   AND description LIKE '%comprehensive fix%';

-- VERIFICATION QUERIES
-- Run these to verify rollback was successful:

-- Check if columns were removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
  AND column_name IN ('cancelled_at', 'cancelled_by', 'cancellation_reason', 'refund_amount', 'cancellation_notes');
-- Expected: 0 rows

-- Check if functions were removed
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('atomic_checkout_v3', 'map_payment_method_canonical', 'update_folio_on_payment_change');
-- Expected: 0 rows

-- Check if trigger was removed
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trg_update_folio_on_payment';
-- Expected: 0 rows
