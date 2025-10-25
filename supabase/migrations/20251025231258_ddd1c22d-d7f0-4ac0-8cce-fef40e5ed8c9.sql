-- Fix audit_log column name mismatch in QR functions
-- This migration corrects functions that were using "details" instead of "description"
-- and adds proper actor_id and metadata fields

-- Fix toggle_qr_status function
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
  
  -- ✅ FIXED: Log audit entry with correct schema
  INSERT INTO audit_log (
    tenant_id, 
    actor_id,
    action, 
    resource_type,
    resource_id,
    description,
    metadata
  )
  VALUES (
    v_tenant_id,
    auth.uid(),
    CASE WHEN p_is_active THEN 'QR_ACTIVATED' ELSE 'QR_DEACTIVATED' END,
    'qr_code',
    p_qr_id,
    CASE 
      WHEN p_is_active THEN 'QR code activated'
      ELSE 'QR code deactivated'
    END,
    jsonb_build_object(
      'qr_label', v_qr_label,
      'reason', COALESCE(p_reason, 'Manual status change'),
      'new_status', CASE WHEN p_is_active THEN 'active' ELSE 'inactive' END
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Fix auto_expire_qr_on_checkout function
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
      is_active = true,
      expires_at = NEW.check_out_date + interval '24 hours',
      updated_at = now()
    WHERE room_id = NEW.room_id
      AND is_active = true;
      
    -- ✅ FIXED: Log the grace period activation with correct schema
    INSERT INTO audit_log (
      tenant_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      description,
      metadata
    )
    SELECT 
      qr.tenant_id,
      NULL,
      'QR_GRACE_PERIOD_ACTIVATED',
      'qr_code',
      qr.id,
      'QR code grace period activated after checkout',
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION toggle_qr_status(UUID, BOOLEAN, TEXT) TO authenticated;