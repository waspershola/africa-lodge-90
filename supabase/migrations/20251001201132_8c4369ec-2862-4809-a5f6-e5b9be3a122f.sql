-- Phase 4: Payment Method Hardening (Fixed)
-- Add server-side payment method validation

-- Function to validate payment method before insertion
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
    
    v_is_valid := true;
  ELSE
    -- Legacy validation: check against string values
    v_is_valid := p_payment_method IN (
      'cash', 'card', 'pos', 'transfer', 'credit', 
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
          'mobile_money', 'paystack', 'flutterwave',
          'pay_later', 'corporate'
        ]
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'method', COALESCE(v_method_name, p_payment_method)
  );
END;
$$;

-- Add trigger to validate payment method on insert
CREATE OR REPLACE FUNCTION public.validate_payment_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validation_result JSONB;
BEGIN
  -- Validate payment method
  v_validation_result := public.validate_payment_method(
    NEW.tenant_id,
    NEW.payment_method,
    NEW.payment_method_id
  );
  
  -- If validation fails, raise exception
  IF NOT (v_validation_result->>'valid')::BOOLEAN THEN
    RAISE EXCEPTION 'Payment validation failed: %', v_validation_result->>'error'
      USING DETAIL = v_validation_result::TEXT,
            HINT = 'Ensure payment method is valid and enabled';
  END IF;
  
  -- Log payment validation in audit_log
  INSERT INTO public.audit_log (
    action,
    resource_type,
    tenant_id,
    actor_id,
    description,
    metadata
  ) VALUES (
    'PAYMENT_VALIDATED',
    'PAYMENT',
    NEW.tenant_id,
    NEW.processed_by,
    'Payment method validated successfully',
    jsonb_build_object(
      'payment_method', NEW.payment_method,
      'payment_method_id', NEW.payment_method_id,
      'amount', NEW.amount,
      'validation_result', v_validation_result
    )
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS validate_payment_method_trigger ON public.payments;
CREATE TRIGGER validate_payment_method_trigger
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_before_insert();

-- Add index for faster payment method lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_enabled 
  ON public.payment_methods(tenant_id, enabled) 
  WHERE enabled = true;

COMMENT ON FUNCTION public.validate_payment_method IS 'Validates payment method against configured tenant payment methods or legacy string values';
COMMENT ON TRIGGER validate_payment_method_trigger ON public.payments IS 'Validates payment method before insertion to prevent invalid payment methods';