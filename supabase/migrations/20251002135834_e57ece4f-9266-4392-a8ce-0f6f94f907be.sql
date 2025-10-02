
-- ============================================================================
-- COMPREHENSIVE FIX V2: Payment, Checkout, Cancel, and Real-time Updates
-- Addresses all reported issues with atomic operations and data integrity
-- ============================================================================

-- PART 1: Add cancellation tracking columns to reservations (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reservations' AND column_name = 'cancelled_at') THEN
    ALTER TABLE reservations 
      ADD COLUMN cancelled_at timestamptz,
      ADD COLUMN cancelled_by uuid,
      ADD COLUMN cancellation_reason text,
      ADD COLUMN refund_amount numeric DEFAULT 0,
      ADD COLUMN cancellation_notes text;
  END IF;
END $$;

-- PART 2: Create canonical payment method mapping function
CREATE OR REPLACE FUNCTION map_payment_method_canonical(
  p_method_type text
) RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  -- Map to canonical types: cash, card, transfer, pos, credit, digital, complimentary
  CASE lower(trim(p_method_type))
    WHEN 'cash' THEN RETURN 'cash';
    WHEN 'pos' THEN RETURN 'pos';
    WHEN 'card' THEN RETURN 'card';
    WHEN 'transfer' THEN RETURN 'transfer';
    WHEN 'bank' THEN RETURN 'transfer';
    WHEN 'credit' THEN RETURN 'credit';
    WHEN 'digital' THEN RETURN 'digital';
    WHEN 'complimentary' THEN RETURN 'complimentary';
    WHEN 'moniepoint' THEN RETURN 'pos';
    WHEN 'moniepoint pos' THEN RETURN 'pos';
    WHEN 'opay' THEN RETURN 'pos';
    WHEN 'opay pos' THEN RETURN 'pos';
    WHEN 'fcmb' THEN RETURN 'transfer';
    WHEN 'mobile money' THEN RETURN 'digital';
    WHEN 'wallet' THEN RETURN 'digital';
    WHEN 'pay later' THEN RETURN 'credit';
    WHEN 'invoice' THEN RETURN 'credit';
    ELSE RETURN 'cash';
  END CASE;
END;
$$;

-- PART 3: Drop and recreate cancel_reservation_atomic with new return type
DROP FUNCTION IF EXISTS cancel_reservation_atomic(uuid, uuid, uuid, text);

CREATE FUNCTION cancel_reservation_atomic(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_cancelled_by uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS TABLE(success boolean, message text, reservation_id uuid) 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id uuid;
  v_current_status text;
  v_folio_id uuid;
BEGIN
  SELECT r.room_id, r.status, f.id
  INTO v_room_id, v_current_status, v_folio_id
  FROM reservations r
  LEFT JOIN folios f ON f.reservation_id = r.id AND f.status = 'open'
  WHERE r.id = p_reservation_id 
    AND r.tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Reservation not found'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_current_status IN ('cancelled', 'checked_out') THEN
    RETURN QUERY SELECT false, 
      ('Reservation already ' || v_current_status)::text, 
      p_reservation_id;
    RETURN;
  END IF;

  UPDATE reservations
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = COALESCE(p_cancelled_by, auth.uid()),
    cancellation_reason = p_reason,
    updated_at = now()
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;

  IF v_folio_id IS NOT NULL THEN
    UPDATE folios
    SET status = 'closed',
        closed_at = now(),
        closed_by = COALESCE(p_cancelled_by, auth.uid()),
        updated_at = now()
    WHERE id = v_folio_id;
  END IF;

  IF v_room_id IS NOT NULL THEN
    UPDATE rooms
    SET 
      reservation_id = NULL,
      status = CASE 
        WHEN status = 'reserved' THEN 'available'
        WHEN status = 'occupied' THEN 'dirty'
        ELSE status
      END,
      updated_at = now()
    WHERE id = v_room_id AND tenant_id = p_tenant_id;
  END IF;

  INSERT INTO audit_log(
    action, resource_type, resource_id, tenant_id, 
    actor_id, description, metadata
  ) VALUES (
    'CANCEL_RESERVATION',
    'RESERVATION',
    p_reservation_id,
    p_tenant_id,
    COALESCE(p_cancelled_by, auth.uid()),
    COALESCE(p_reason, 'Reservation cancelled'),
    jsonb_build_object(
      'room_id', v_room_id,
      'previous_status', v_current_status,
      'cancelled_at', now()
    )
  );

  RETURN QUERY SELECT true, 'Reservation cancelled successfully'::text, p_reservation_id;
END;
$$;

-- PART 4: Enhanced atomic_checkout with payment validation
CREATE OR REPLACE FUNCTION atomic_checkout_v3(
  p_tenant_id uuid,
  p_reservation_id uuid
) RETURNS TABLE(
  success boolean,
  message text,
  folio_id uuid,
  room_id uuid,
  final_balance numeric
) 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id uuid;
  v_folio_id uuid;
  v_folio_balance numeric;
  v_total_charges numeric;
  v_total_payments numeric;
  v_reservation_status text;
  checkout_start_time timestamp := clock_timestamp();
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext(p_reservation_id::text)) THEN
    RETURN QUERY SELECT false, 'Checkout already in progress'::text, 
      NULL::uuid, NULL::uuid, NULL::numeric;
    RETURN;
  END IF;

  SELECT r.room_id, r.status
  INTO v_room_id, v_reservation_status
  FROM reservations r
  WHERE r.id = p_reservation_id 
    AND r.tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Reservation not found'::text, 
      NULL::uuid, NULL::uuid, NULL::numeric;
    RETURN;
  END IF;

  IF v_reservation_status != 'checked_in' THEN
    RETURN QUERY SELECT false, 
      ('Cannot checkout: reservation is ' || v_reservation_status)::text,
      NULL::uuid, NULL::uuid, NULL::numeric;
    RETURN;
  END IF;

  SELECT f.id, f.total_charges, f.total_payments, 
         (f.total_charges - f.total_payments) as balance
  INTO v_folio_id, v_total_charges, v_total_payments, v_folio_balance
  FROM folios f
  WHERE f.reservation_id = p_reservation_id 
    AND f.tenant_id = p_tenant_id
    AND f.status = 'open';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No open folio found'::text,
      NULL::uuid, v_room_id, NULL::numeric;
    RETURN;
  END IF;

  IF v_folio_balance > 0.01 THEN
    RETURN QUERY SELECT false, 
      ('Outstanding balance: ₦' || v_folio_balance::text)::text,
      v_folio_id, v_room_id, v_folio_balance;
    RETURN;
  END IF;

  UPDATE folios
  SET 
    status = 'closed',
    closed_at = now(),
    closed_by = auth.uid(),
    updated_at = now()
  WHERE id = v_folio_id;

  UPDATE reservations
  SET 
    status = 'checked_out',
    checked_out_at = now(),
    updated_at = now()
  WHERE id = p_reservation_id;

  UPDATE rooms
  SET 
    status = 'dirty',
    reservation_id = NULL,
    updated_at = now()
  WHERE id = v_room_id AND tenant_id = p_tenant_id;

  INSERT INTO audit_log(
    action, resource_type, resource_id, tenant_id,
    actor_id, description, metadata
  ) VALUES (
    'CHECKOUT',
    'RESERVATION',
    p_reservation_id,
    p_tenant_id,
    auth.uid(),
    'Guest checked out successfully',
    jsonb_build_object(
      'room_id', v_room_id,
      'folio_id', v_folio_id,
      'final_balance', v_folio_balance,
      'checkout_duration_ms', EXTRACT(MILLISECOND FROM clock_timestamp() - checkout_start_time)
    )
  );

  RETURN QUERY SELECT true, 'Checkout completed successfully'::text,
    v_folio_id, v_room_id, 0::numeric;
END;
$$;

-- PART 5: Trigger to update folio balance on payment changes
CREATE OR REPLACE FUNCTION update_folio_on_payment_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'completed' THEN
    UPDATE folios
    SET 
      total_payments = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE folio_id = NEW.folio_id AND status = 'completed'
      ),
      updated_at = now()
    WHERE id = NEW.folio_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
    UPDATE folios
    SET 
      total_payments = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE folio_id = OLD.folio_id AND status = 'completed'
      ),
      updated_at = now()
    WHERE id = OLD.folio_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_folio_on_payment ON payments;
CREATE TRIGGER trg_update_folio_on_payment
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_folio_on_payment_change();

GRANT EXECUTE ON FUNCTION map_payment_method_canonical(text) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_reservation_atomic(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_checkout_v3(uuid, uuid) TO authenticated;
