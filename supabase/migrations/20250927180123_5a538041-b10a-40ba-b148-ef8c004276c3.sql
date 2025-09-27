-- Create function for bulk seeding existing tenants
CREATE OR REPLACE FUNCTION public.bulk_seed_existing_tenants()
RETURNS TABLE(tenant_id UUID, tenant_name TEXT, seeded_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tenant_record RECORD;
  seed_result INTEGER;
BEGIN
  FOR tenant_record IN
    SELECT t.id, t.hotel_name
    FROM tenants t
    WHERE t.is_active = true
  LOOP
    seed_result := seed_tenant_sms_templates(tenant_record.id);
    
    RETURN QUERY SELECT tenant_record.id, tenant_record.hotel_name, seed_result;
  END LOOP;
END;
$function$;

-- Create function to sync updated global templates to existing tenants
CREATE OR REPLACE FUNCTION public.sync_global_template_to_tenants(p_global_template_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  global_template RECORD;
  tenant_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  -- Get the global template
  SELECT * INTO global_template 
  FROM sms_templates 
  WHERE id = p_global_template_id AND is_global = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Update all existing tenant templates that came from this global template
  UPDATE sms_templates 
  SET 
    template_name = global_template.template_name,
    message_template = global_template.message_template,
    variables = global_template.variables,
    estimated_sms_count = global_template.estimated_sms_count,
    character_count_warning = global_template.character_count_warning,
    last_synced_at = now(),
    updated_at = now()
  WHERE source_template_id = p_global_template_id;
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  -- For tenants that don't have this template yet, create it
  FOR tenant_record IN
    SELECT DISTINCT t.id as tenant_id
    FROM tenants t
    WHERE NOT EXISTS (
      SELECT 1 FROM sms_templates st
      WHERE st.tenant_id = t.id 
        AND st.event_type = global_template.event_type
    )
  LOOP
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
      tenant_record.tenant_id,
      global_template.template_name,
      global_template.event_type,
      global_template.message_template,
      global_template.variables,
      true,
      false,
      true,
      global_template.estimated_sms_count,
      global_template.character_count_warning,
      p_global_template_id,
      now()
    );
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN synced_count;
END;
$function$;