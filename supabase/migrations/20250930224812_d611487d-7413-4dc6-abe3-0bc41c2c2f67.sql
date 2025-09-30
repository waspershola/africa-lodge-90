-- Phase 2: Atomic Checkout Function

-- Create atomic checkout function to prevent race conditions
CREATE OR REPLACE FUNCTION public.atomic_checkout(
  p_tenant_id uuid,
  p_reservation_id uuid
) RETURNS TABLE(
  success boolean,
  folio_id uuid,
  room_id uuid,
  message text
) AS $$
DECLARE
  v_folio_id uuid;
  v_room_id uuid;
  v_balance numeric;
  v_reservation_status text;
BEGIN
  -- Start transaction isolation
  BEGIN
    -- 1. Lock and verify reservation
    SELECT id, room_id, status INTO p_reservation_id, v_room_id, v_reservation_status
    FROM reservations
    WHERE id = p_reservation_id 
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 'Reservation not found'::text;
      RETURN;
    END IF;

    IF v_reservation_status != 'checked_in' THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 
        ('Reservation is ' || v_reservation_status || ' and cannot be checked out')::text;
      RETURN;
    END IF;

    -- 2. Lock and get folio
    SELECT id, balance INTO v_folio_id, v_balance
    FROM folios
    WHERE reservation_id = p_reservation_id 
      AND tenant_id = p_tenant_id
      AND status = 'open'
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 'Active folio not found'::text;
      RETURN;
    END IF;

    -- 3. Check if balance is settled
    IF v_balance > 0 THEN
      RETURN QUERY SELECT false, v_folio_id, v_room_id, 
        ('Outstanding balance: ₦' || v_balance::text || '. Please settle all bills before checkout.')::text;
      RETURN;
    END IF;

    -- 4. Close folio
    UPDATE folios
    SET 
      status = 'closed',
      closed_at = now(),
      updated_at = now()
    WHERE id = v_folio_id;

    -- 5. Update reservation to checked_out
    UPDATE reservations
    SET 
      status = 'checked_out',
      updated_at = now()
    WHERE id = p_reservation_id;

    -- 6. Update room status to dirty (needs cleaning)
    UPDATE rooms
    SET 
      status = 'dirty',
      updated_at = now()
    WHERE id = v_room_id
      AND tenant_id = p_tenant_id;

    -- Return success
    RETURN QUERY SELECT 
      true, 
      v_folio_id, 
      v_room_id,
      'Checkout completed successfully'::text;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback happens automatically
      RETURN QUERY SELECT 
        false, 
        NULL::uuid, 
        NULL::uuid,
        ('Checkout failed: ' || SQLERRM)::text;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION atomic_checkout(uuid, uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION atomic_checkout IS 
  'Atomically checks out a guest: verifies balance is settled, closes folio, updates reservation status, and sets room to dirty. All operations happen in a single transaction.';