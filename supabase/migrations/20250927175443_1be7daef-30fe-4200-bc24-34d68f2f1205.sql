-- Drop existing function first
DROP FUNCTION IF EXISTS public.seed_tenant_sms_templates(uuid);

-- Create function to seed tenant SMS templates from global templates
CREATE OR REPLACE FUNCTION public.seed_tenant_sms_templates(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  template_record RECORD;
  seeded_count INTEGER := 0;
BEGIN
  -- Copy all active global templates that don't already exist for this tenant
  FOR template_record IN
    SELECT 
      gt.id as global_id,
      gt.template_name,
      gt.event_type,
      gt.message_template,
      gt.variables,
      gt.estimated_sms_count,
      gt.character_count_warning
    FROM sms_templates gt
    WHERE gt.is_global = true 
      AND gt.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM sms_templates tt 
        WHERE tt.tenant_id = p_tenant_id 
          AND tt.event_type = gt.event_type
      )
  LOOP
    -- Insert tenant-specific copy
    INSERT INTO sms_templates (
      tenant_id,
      template_name,
      event_type,
      message_template,
      variables,
      is_active,
      is_global,
      allow_tenant_override,
      estimated_sms_count,
      character_count_warning,
      source_template_id,
      last_synced_at
    ) VALUES (
      p_tenant_id,
      template_record.template_name,
      template_record.event_type,
      template_record.message_template,
      template_record.variables,
      true,
      false,
      true,
      template_record.estimated_sms_count,
      template_record.character_count_warning,
      template_record.global_id,
      now()
    );
    
    seeded_count := seeded_count + 1;
  END LOOP;
  
  RETURN seeded_count;
END;
$function$;