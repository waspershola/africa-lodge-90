-- Phase 1: Add RPC function for manual QR status toggling
CREATE OR REPLACE FUNCTION toggle_qr_status(
  p_qr_id UUID,
  p_is_active BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_role TEXT;
  v_qr_label TEXT;
BEGIN
  -- Get current user role
  SELECT role INTO v_user_role 
  FROM user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  -- Permission check: Only OWNER, MANAGER, FRONT_DESK can toggle
  IF v_user_role NOT IN ('OWNER', 'MANAGER', 'FRONT_DESK', 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Insufficient permissions to toggle QR status';
  END IF;
  
  -- Get QR code tenant and label
  SELECT tenant_id, label 
  INTO v_tenant_id, v_qr_label
  FROM qr_codes 
  WHERE id = p_qr_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'QR code not found';
  END IF;
  
  -- Verify user has access to this tenant
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'Access denied to this tenant';
  END IF;
  
  -- Update QR code status
  UPDATE qr_codes 
  SET 
    is_active = p_is_active,
    updated_at = now(),
    expires_at = CASE 
      WHEN p_is_active = false THEN now()
      ELSE NULL 
    END
  WHERE id = p_qr_id;
  
  -- Log audit entry
  INSERT INTO audit_log (
    tenant_id, 
    user_id,
    action, 
    resource_type,
    resource_id,
    details
  )
  VALUES (
    v_tenant_id,
    auth.uid(),
    CASE WHEN p_is_active THEN 'qr_activated' ELSE 'qr_deactivated' END,
    'qr_code',
    p_qr_id,
    jsonb_build_object(
      'qr_label', v_qr_label,
      'reason', COALESCE(p_reason, 'Manual status change'),
      'new_status', CASE WHEN p_is_active THEN 'active' ELSE 'inactive' END
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Phase 2: Modify checkout trigger to add 24-hour grace period
CREATE OR REPLACE FUNCTION auto_expire_qr_on_checkout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if status changed to checked_out
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    -- Set QR code to expire 24 hours after checkout instead of immediate deactivation
    UPDATE qr_codes
    SET 
      is_active = true, -- Keep active during grace period
      expires_at = NEW.check_out_date + interval '24 hours',
      updated_at = now()
    WHERE room_id = NEW.room_id
      AND is_active = true;
      
    -- Log the grace period activation
    INSERT INTO audit_log (
      tenant_id,
      action,
      resource_type,
      resource_id,
      details
    )
    SELECT 
      qr.tenant_id,
      'qr_grace_period_activated',
      'qr_code',
      qr.id,
      jsonb_build_object(
        'room_id', NEW.room_id,
        'checkout_date', NEW.check_out_date,
        'expires_at', NEW.check_out_date + interval '24 hours',
        'guest_name', NEW.guest_name
      )
    FROM qr_codes qr
    WHERE qr.room_id = NEW.room_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;