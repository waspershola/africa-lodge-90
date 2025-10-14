-- Phase 1 & 2: Fix trigger function and add error monitoring
-- =================================================================

-- Fix the auto_seed_tenant_templates trigger to:
-- 1. Use correct column name (tenant_id, not id)
-- 2. Make template seeding non-blocking (don't fail tenant creation)
-- 3. Add comprehensive error logging

CREATE OR REPLACE FUNCTION public.auto_seed_tenant_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    -- Use tenant_id (the actual primary key) instead of id
    PERFORM seed_tenant_sms_templates(NEW.tenant_id);
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail tenant creation
    -- This makes template seeding non-blocking
    INSERT INTO public.audit_log (
      action,
      resource_type,
      resource_id,
      description,
      metadata,
      created_at
    ) VALUES (
      'TEMPLATE_SEED_FAILED',
      'TENANT',
      NEW.tenant_id,
      'Failed to seed SMS templates for new tenant during trigger execution',
      jsonb_build_object(
        'error_message', SQLERRM,
        'error_state', SQLSTATE,
        'tenant_id', NEW.tenant_id,
        'hotel_name', NEW.hotel_name
      ),
      now()
    );
    
    -- Log to console for debugging
    RAISE WARNING 'Template seeding failed for tenant %: % (SQLSTATE: %)', 
      NEW.tenant_id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$function$;

-- Add verification query to confirm fix
COMMENT ON FUNCTION public.auto_seed_tenant_templates() IS 
  'Fixed 2025-01: Now uses tenant_id instead of id, with non-blocking error handling';
