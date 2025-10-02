-- Fix 1: Update validate_payment_method to handle case-insensitive validation
CREATE OR REPLACE FUNCTION public.validate_payment_method(
  p_tenant_id UUID,
  p_payment_method TEXT,
  p_payment_method_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN := false;
  v_method_name TEXT;
  v_method_enabled BOOLEAN;
BEGIN
  -- If payment_method_id is provided, validate against payment_methods table
  IF p_payment_method_id IS NOT NULL THEN
    SELECT 
      name, 
      enabled 
    INTO v_method_name, v_method_enabled
    FROM public.payment_methods
    WHERE id = p_payment_method_id 
      AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Payment method not found',
        'error_code', 'METHOD_NOT_FOUND'
      );
    END IF;
    
    IF NOT v_method_enabled THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Payment method is disabled',
        'error_code', 'METHOD_DISABLED',
        'method_name', v_method_name
      );
    END IF;
    
    RETURN jsonb_build_object(
      'valid', true,
      'method', v_method_name
    );
  END IF;
  
  -- Legacy validation: check against string values (case-insensitive)
  v_is_valid := LOWER(p_payment_method) IN (
    'cash', 'card', 'pos', 'transfer', 'credit', 
    'digital', 'complimentary',
    'mobile_money', 'paystack', 'flutterwave',
    'pay_later', 'corporate'
  );
  
  IF NOT v_is_valid THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Unsupported payment method: %s', p_payment_method),
      'error_code', 'INVALID_METHOD',
      'supported_methods', ARRAY[
        'cash', 'card', 'pos', 'transfer', 'credit',
        'digital', 'complimentary',
        'mobile_money', 'paystack', 'flutterwave',
        'pay_later', 'corporate'
      ]
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'method', LOWER(p_payment_method)
  );
END;
$$;

-- Fix 2: Ensure cancel_reservation_atomic properly handles reserved rooms
CREATE OR REPLACE FUNCTION public.cancel_reservation_atomic(
  p_reservation_id UUID,
  p_tenant_id UUID,
  p_cancelled_by UUID,
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_room_status TEXT;
  v_reservation_status TEXT;
BEGIN
  -- Get reservation details
  SELECT room_id, status 
  INTO v_room_id, v_reservation_status
  FROM public.reservations
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Reservation not found'
    );
  END IF;
  
  -- Check if reservation can be cancelled
  IF v_reservation_status IN ('checked_out', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cannot cancel reservation with status: ' || v_reservation_status
    );
  END IF;
  
  -- Get current room status
  SELECT status INTO v_room_status
  FROM public.rooms
  WHERE id = v_room_id AND tenant_id = p_tenant_id;
  
  -- Update reservation to cancelled
  UPDATE public.reservations
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_cancellation_reason,
    updated_at = NOW()
  WHERE id = p_reservation_id AND tenant_id = p_tenant_id;
  
  -- Update room status to available if it's currently reserved or occupied
  -- Also clear the reservation_id FK and current_guest
  UPDATE public.rooms
  SET
    status = 'available',
    reservation_id = NULL,
    current_guest = NULL,
    updated_at = NOW()
  WHERE id = v_room_id 
    AND tenant_id = p_tenant_id
    AND status IN ('reserved', 'occupied');
  
  -- Close any open folios for this reservation
  UPDATE public.folios
  SET
    status = 'closed',
    closed_at = NOW(),
    closed_by = p_cancelled_by,
    updated_at = NOW()
  WHERE reservation_id = p_reservation_id
    AND tenant_id = p_tenant_id
    AND status = 'open';
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reservation cancelled successfully',
    'reservation_id', p_reservation_id,
    'room_id', v_room_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cancellation failed: ' || SQLERRM
    );
END;
$$;