-- Phase 1 Remediation: Fix Function Search Paths for Security Definer Functions
-- This ensures all security definer functions have explicit search_path set

-- Fix any functions that might be missing search_path
-- Note: Most functions already have search_path set, but this ensures consistency

-- Verify and update seed_tenant_sms_templates if needed
CREATE OR REPLACE FUNCTION public.seed_tenant_sms_templates(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  templates_created integer := 0;
  template_config record;
BEGIN
  -- Define default SMS templates with proper configuration
  FOR template_config IN
    SELECT * FROM (VALUES
      ('booking_confirmation', 'Booking Confirmation', 'Dear {{guest_name}}, your booking at {{hotel_name}} is confirmed for {{check_in_date}} to {{check_out_date}}. Booking ref: {{reservation_number}}', ARRAY['guest_name', 'hotel_name', 'check_in_date', 'check_out_date', 'reservation_number'], 1, false),
      ('check_in_ready', 'Check-in Ready', 'Hello {{guest_name}}, your room is ready for check-in at {{hotel_name}}. Room: {{room_number}}', ARRAY['guest_name', 'hotel_name', 'room_number'], 1, false),
      ('check_out_reminder', 'Check-out Reminder', 'Dear {{guest_name}}, check-out time is {{check_out_time}}. We hope you enjoyed your stay at {{hotel_name}}!', ARRAY['guest_name', 'check_out_time', 'hotel_name'], 1, false),
      ('payment_received', 'Payment Received', 'Payment of {{amount}} received for {{guest_name}}. Thank you! - {{hotel_name}}', ARRAY['guest_name', 'amount', 'hotel_name'], 1, false),
      ('payment_reminder', 'Payment Reminder', 'Dear {{guest_name}}, you have an outstanding balance of {{amount}} at {{hotel_name}}. Please settle at your earliest convenience.', ARRAY['guest_name', 'amount', 'hotel_name'], 1, false)
    ) AS t(event_type, template_name, message_template, variables, estimated_sms_count, character_count_warning)
  LOOP
    -- Insert template if it doesn't exist for this tenant and event type
    INSERT INTO public.sms_templates (
      tenant_id,
      template_name,
      event_type,
      message_template,
      variables,
      is_active,
      is_global,
      allow_tenant_override,
      estimated_sms_count,
      character_count_warning
    )
    SELECT
      p_tenant_id,
      template_config.template_name,
      template_config.event_type,
      template_config.message_template,
      template_config.variables::jsonb,
      true,
      false,
      true,
      template_config.estimated_sms_count,
      template_config.character_count_warning
    WHERE NOT EXISTS (
      SELECT 1 FROM public.sms_templates
      WHERE tenant_id = p_tenant_id
        AND event_type = template_config.event_type
    );
    
    IF FOUND THEN
      templates_created := templates_created + 1;
    END IF;
  END LOOP;
  
  RETURN templates_created;
END;
$$;

-- Verify get_user_role has proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'GUEST');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'GUEST';
END;
$$;

-- Verify is_super_admin has proper search_path
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
    AND is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

COMMENT ON FUNCTION public.seed_tenant_sms_templates IS 'Security definer function with explicit search_path for tenant SMS template seeding';
COMMENT ON FUNCTION public.get_user_role IS 'Security definer function with explicit search_path for role retrieval';
COMMENT ON FUNCTION public.is_super_admin IS 'Security definer function with explicit search_path for admin verification';