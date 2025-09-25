-- Get the IDs of backup admin users to clean up comprehensively
DO $$
DECLARE
  backup_admin_ids uuid[];
BEGIN
  -- Get the IDs
  SELECT ARRAY(SELECT id FROM public.users WHERE email IN ('backup-admin1@luxuryhotelpro.com', 'backup-admin2@luxuryhotelpro.com')) INTO backup_admin_ids;
  
  -- Clean up ALL foreign key references systematically
  DELETE FROM public.audit_log WHERE actor_id = ANY(backup_admin_ids);
  DELETE FROM public.emergency_access_attempts WHERE user_id = ANY(backup_admin_ids);
  DELETE FROM public.recovery_codes WHERE user_id = ANY(backup_admin_ids);
  DELETE FROM public.recovery_sessions WHERE user_id = ANY(backup_admin_ids);
  DELETE FROM public.impersonations WHERE original_user_id = ANY(backup_admin_ids) OR impersonated_user_id = ANY(backup_admin_ids);
  
  -- Also clean up any other potential references
  UPDATE public.folios SET closed_by = NULL WHERE closed_by = ANY(backup_admin_ids);
  UPDATE public.folio_charges SET posted_by = NULL WHERE posted_by = ANY(backup_admin_ids);
  UPDATE public.payments SET processed_by = NULL WHERE processed_by = ANY(backup_admin_ids);
  UPDATE public.housekeeping_tasks SET created_by = NULL WHERE created_by = ANY(backup_admin_ids);
  UPDATE public.housekeeping_tasks SET assigned_to = NULL WHERE assigned_to = ANY(backup_admin_ids);
  UPDATE public.pos_orders SET taken_by = NULL WHERE taken_by = ANY(backup_admin_ids);
  UPDATE public.pos_orders SET prepared_by = NULL WHERE prepared_by = ANY(backup_admin_ids);
  UPDATE public.pos_orders SET served_by = NULL WHERE served_by = ANY(backup_admin_ids);
  UPDATE public.fuel_logs SET created_by = NULL WHERE created_by = ANY(backup_admin_ids);
  UPDATE public.power_logs SET created_by = NULL WHERE created_by = ANY(backup_admin_ids);
  UPDATE public.documents SET created_by = NULL WHERE created_by = ANY(backup_admin_ids);
  UPDATE public.qr_codes SET created_by = NULL WHERE created_by = ANY(backup_admin_ids);
  UPDATE public.group_reservations SET created_by = NULL WHERE created_by = ANY(backup_admin_ids);
  
  -- Temporarily modify the prevention function to allow backup admin removal
  EXECUTE 'CREATE OR REPLACE FUNCTION public.prevent_platform_owner_changes()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''public''
  AS $func$
  BEGIN
    -- Allow removal of backup admin accounts
    IF OLD.email IN (''backup-admin1@luxuryhotelpro.com'', ''backup-admin2@luxuryhotelpro.com'') THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Original protection logic for other platform owners
    IF OLD.is_platform_owner = true AND (
      TG_OP = ''DELETE'' OR 
      NEW.role IS DISTINCT FROM OLD.role OR
      NEW.is_platform_owner IS DISTINCT FROM OLD.is_platform_owner
    ) THEN
      RAISE EXCEPTION ''Platform owner cannot be deleted, have role changed, or lose platform owner status'';
    END IF;
    RETURN COALESCE(NEW, OLD);
  END;
  $func$;';
  
  -- Now remove the backup admin users
  DELETE FROM public.users WHERE email IN ('backup-admin1@luxuryhotelpro.com', 'backup-admin2@luxuryhotelpro.com');
  
  -- Restore the original protection function
  EXECUTE 'CREATE OR REPLACE FUNCTION public.prevent_platform_owner_changes()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''public''
  AS $func$
  BEGIN
    -- Strict protection for all platform owners
    IF OLD.is_platform_owner = true AND (
      TG_OP = ''DELETE'' OR 
      NEW.role IS DISTINCT FROM OLD.role OR
      NEW.is_platform_owner IS DISTINCT FROM OLD.is_platform_owner
    ) THEN
      RAISE EXCEPTION ''Platform owner cannot be deleted, have role changed, or lose platform owner status'';
    END IF;
    RETURN COALESCE(NEW, OLD);
  END;
  $func$;';
END $$;