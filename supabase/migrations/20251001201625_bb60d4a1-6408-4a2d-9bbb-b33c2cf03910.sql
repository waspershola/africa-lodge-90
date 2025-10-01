-- Phase 5: Atomic Operations Enhancement
-- Add advisory locks, enhanced logging, and race condition prevention

-- Create advisory lock helper function
CREATE OR REPLACE FUNCTION public.try_advisory_lock_with_timeout(
  lock_key BIGINT,
  timeout_seconds INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_acquired BOOLEAN := false;
  start_time TIMESTAMP;
BEGIN
  start_time := clock_timestamp();
  
  LOOP
    -- Try to acquire advisory lock
    lock_acquired := pg_try_advisory_lock(lock_key);
    
    IF lock_acquired THEN
      RETURN true;
    END IF;
    
    -- Check timeout
    IF EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) >= timeout_seconds THEN
      RETURN false;
    END IF;
    
    -- Brief pause before retry
    PERFORM pg_sleep(0.1);
  END LOOP;
END;
$$;

-- Enhanced atomic checkout with race condition prevention
CREATE OR REPLACE FUNCTION public.atomic_checkout_v2(
  p_tenant_id UUID,
  p_reservation_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  folio_id UUID,
  room_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation RECORD;
  v_folio_id UUID;
  v_lock_key BIGINT;
  v_lock_acquired BOOLEAN;
  v_start_time TIMESTAMP;
  v_duration_ms INTEGER;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Generate lock key from reservation ID
  v_lock_key := ('x' || substring(p_reservation_id::text, 1, 15))::bit(60)::bigint;
  
  -- Try to acquire advisory lock with timeout
  v_lock_acquired := public.try_advisory_lock_with_timeout(v_lock_key, 10);
  
  IF NOT v_lock_acquired THEN
    RETURN QUERY SELECT 
      false,
      NULL::UUID,
      NULL::UUID,
      'Another checkout operation is in progress for this reservation'::TEXT;
    RETURN;
  END IF;
  
  BEGIN
    -- Fetch and validate reservation
    SELECT * INTO v_reservation
    FROM public.reservations
    WHERE id = p_reservation_id 
      AND tenant_id = p_tenant_id
      AND status = 'checked_in';
    
    IF NOT FOUND THEN
      PERFORM pg_advisory_unlock(v_lock_key);
      RETURN QUERY SELECT 
        false,
        NULL::UUID,
        NULL::UUID,
        'Reservation not found or not in checked_in status'::TEXT;
      RETURN;
    END IF;
    
    -- Get open folio
    SELECT id INTO v_folio_id
    FROM public.folios
    WHERE reservation_id = p_reservation_id
      AND status = 'open'
    LIMIT 1;
    
    IF v_folio_id IS NULL THEN
      PERFORM pg_advisory_unlock(v_lock_key);
      RETURN QUERY SELECT 
        false,
        NULL::UUID,
        v_reservation.room_id,
        'No open folio found for reservation'::TEXT;
      RETURN;
    END IF;
    
    -- Check if folio has outstanding balance
    DECLARE
      v_balance NUMERIC;
    BEGIN
      SELECT balance INTO v_balance
      FROM public.folios
      WHERE id = v_folio_id;
      
      IF v_balance > 0 THEN
        PERFORM pg_advisory_unlock(v_lock_key);
        RETURN QUERY SELECT 
          false,
          v_folio_id,
          v_reservation.room_id,
          format('Outstanding balance of %s must be paid before checkout', v_balance)::TEXT;
        RETURN;
      END IF;
    END;
    
    -- Perform atomic checkout operations
    -- 1. Close folio
    UPDATE public.folios
    SET 
      status = 'closed',
      closed_at = now(),
      closed_by = auth.uid(),
      updated_at = now()
    WHERE id = v_folio_id;
    
    -- 2. Update reservation status
    UPDATE public.reservations
    SET 
      status = 'checked_out',
      checked_out_at = now(),
      checked_out_by = auth.uid(),
      updated_at = now()
    WHERE id = p_reservation_id;
    
    -- 3. Update room status
    UPDATE public.rooms
    SET 
      status = 'cleaning',
      updated_at = now()
    WHERE id = v_reservation.room_id;
    
    -- Calculate operation duration
    v_duration_ms := EXTRACT(MILLISECOND FROM (clock_timestamp() - v_start_time))::INTEGER;
    
    -- Log successful checkout
    INSERT INTO public.audit_log (
      action,
      resource_type,
      resource_id,
      tenant_id,
      actor_id,
      description,
      metadata
    ) VALUES (
      'ATOMIC_CHECKOUT_V2',
      'RESERVATION',
      p_reservation_id,
      p_tenant_id,
      auth.uid(),
      'Atomic checkout completed successfully',
      jsonb_build_object(
        'reservation_id', p_reservation_id,
        'folio_id', v_folio_id,
        'room_id', v_reservation.room_id,
        'duration_ms', v_duration_ms,
        'version', 'v2'
      )
    );
    
    -- Release advisory lock
    PERFORM pg_advisory_unlock(v_lock_key);
    
    RETURN QUERY SELECT 
      true,
      v_folio_id,
      v_reservation.room_id,
      'Checkout completed successfully'::TEXT;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Release lock on error
      PERFORM pg_advisory_unlock(v_lock_key);
      
      -- Log error
      INSERT INTO public.audit_log (
        action,
        resource_type,
        resource_id,
        tenant_id,
        description,
        metadata
      ) VALUES (
        'ATOMIC_CHECKOUT_ERROR',
        'RESERVATION',
        p_reservation_id,
        p_tenant_id,
        format('Checkout failed: %s', SQLERRM),
        jsonb_build_object(
          'error', SQLERRM,
          'error_detail', SQLSTATE,
          'version', 'v2'
        )
      );
      
      RETURN QUERY SELECT 
        false,
        NULL::UUID,
        v_reservation.room_id,
        format('Checkout failed: %s', SQLERRM)::TEXT;
  END;
END;
$$;

-- Enhanced reservation conflict detection
CREATE OR REPLACE FUNCTION public.check_reservation_conflict(
  p_tenant_id UUID,
  p_room_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflicting_reservation_id UUID,
  conflict_details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Check for overlapping reservations
  SELECT r.id, r.reservation_number, r.guest_name, r.check_in_date, r.check_out_date
  INTO v_conflict
  FROM public.reservations r
  WHERE r.tenant_id = p_tenant_id
    AND r.room_id = p_room_id
    AND r.status IN ('confirmed', 'checked_in')
    AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
    AND (
      -- New reservation starts during existing reservation
      (p_check_in_date >= r.check_in_date AND p_check_in_date < r.check_out_date)
      OR
      -- New reservation ends during existing reservation
      (p_check_out_date > r.check_in_date AND p_check_out_date <= r.check_out_date)
      OR
      -- New reservation completely overlaps existing reservation
      (p_check_in_date <= r.check_in_date AND p_check_out_date >= r.check_out_date)
    )
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      true,
      v_conflict.id,
      format(
        'Room already reserved by %s from %s to %s (Reservation: %s)',
        v_conflict.guest_name,
        v_conflict.check_in_date,
        v_conflict.check_out_date,
        v_conflict.reservation_number
      )::TEXT;
  ELSE
    RETURN QUERY SELECT 
      false,
      NULL::UUID,
      'No conflicts found'::TEXT;
  END IF;
END;
$$;

-- Enhanced overstay detection with grace period
CREATE OR REPLACE FUNCTION public.detect_overstays(
  p_tenant_id UUID,
  p_grace_hours INTEGER DEFAULT 3
)
RETURNS TABLE(
  reservation_id UUID,
  room_id UUID,
  guest_name TEXT,
  expected_checkout DATE,
  hours_overdue INTEGER,
  folio_balance NUMERIC,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as reservation_id,
    r.room_id,
    r.guest_name,
    r.check_out_date as expected_checkout,
    EXTRACT(HOUR FROM (now() - (r.check_out_date + '14:00:00'::TIME)))::INTEGER as hours_overdue,
    COALESCE(f.balance, 0) as folio_balance,
    CASE 
      WHEN EXTRACT(HOUR FROM (now() - (r.check_out_date + '14:00:00'::TIME))) > 24 THEN 'critical'
      WHEN EXTRACT(HOUR FROM (now() - (r.check_out_date + '14:00:00'::TIME))) > p_grace_hours THEN 'warning'
      ELSE 'info'
    END as severity
  FROM public.reservations r
  LEFT JOIN public.folios f ON f.reservation_id = r.id AND f.status = 'open'
  WHERE r.tenant_id = p_tenant_id
    AND r.status = 'checked_in'
    AND r.check_out_date < CURRENT_DATE
    AND (r.check_out_date + '14:00:00'::TIME + (p_grace_hours || ' hours')::INTERVAL) < now()
  ORDER BY hours_overdue DESC;
END;
$$;

COMMENT ON FUNCTION public.try_advisory_lock_with_timeout IS 'Attempts to acquire advisory lock with configurable timeout';
COMMENT ON FUNCTION public.atomic_checkout_v2 IS 'Enhanced atomic checkout with advisory locks and comprehensive error handling';
COMMENT ON FUNCTION public.check_reservation_conflict IS 'Detects reservation conflicts for a given room and date range';
COMMENT ON FUNCTION public.detect_overstays IS 'Identifies overdue checkouts with configurable grace period';