-- Fix folio payment calculation to only count "paid" payments
-- This excludes Pay Later (credit) payments which have payment_status = 'unpaid'

CREATE OR REPLACE FUNCTION public.update_folio_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update folio payment totals when payments change (balance is auto-calculated)
  -- CRITICAL FIX: Only count payments where payment_status = 'paid'
  -- This excludes Pay Later (credit) which has payment_status = 'unpaid'
  UPDATE folios SET
    total_payments = COALESCE((
      SELECT SUM(amount) FROM payments 
      WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
      AND status = 'completed'
      AND payment_status = 'paid'  -- Only count actually paid amounts
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;