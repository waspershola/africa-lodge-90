-- Fix the update_folio_totals trigger to not update generated balance column
CREATE OR REPLACE FUNCTION public.update_folio_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update folio totals when charges change (balance is auto-calculated)
  UPDATE folios SET
    total_charges = COALESCE((
      SELECT SUM(amount) FROM folio_charges 
      WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix the update_folio_payments trigger to not update generated balance column  
CREATE OR REPLACE FUNCTION public.update_folio_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update folio payment totals when payments change (balance is auto-calculated)
  UPDATE folios SET
    total_payments = COALESCE((
      SELECT SUM(amount) FROM payments 
      WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
      AND status = 'completed'
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;