-- ===================================================================
-- Phase 3: SMS Credit Monitoring Background Job
-- ===================================================================

-- Create function to monitor SMS credit balances
CREATE OR REPLACE FUNCTION public.monitor_sms_credits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  start_time timestamp := clock_timestamp();
  low_balance_count integer := 0;
  critical_balance_count integer := 0;
  v_tenant record;
BEGIN
  -- Create log entry
  INSERT INTO public.background_job_logs (job_name, status)
  VALUES ('monitor_sms_credits', 'running')
  RETURNING id INTO log_id;

  -- Check if feature is enabled
  IF NOT is_background_jobs_enabled() THEN
    UPDATE public.background_job_logs
    SET status = 'skipped', 
        completed_at = now(),
        execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer,
        error_message = 'Feature flag disabled'
    WHERE id = log_id;
    
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'feature_disabled');
  END IF;

  -- Monitor tenants with low SMS credits
  FOR v_tenant IN
    SELECT 
      t.id as tenant_id,
      t.hotel_name,
      sc.balance as sms_balance,
      hs.front_desk_phone,
      CASE 
        WHEN sc.balance <= 10 THEN 'critical'
        WHEN sc.balance <= 50 THEN 'low'
        ELSE 'normal'
      END as alert_level
    FROM public.tenants t
    LEFT JOIN public.sms_credits sc ON sc.tenant_id = t.id
    LEFT JOIN public.hotel_settings hs ON hs.tenant_id = t.id
    WHERE t.is_active = true
      AND t.subscription_status = 'active'
      AND (sc.balance <= 50 OR sc.balance IS NULL)
  LOOP
    BEGIN
      -- Log the low balance alert
      INSERT INTO public.audit_log (
        action, resource_type, tenant_id,
        description, metadata
      ) VALUES (
        'SMS_CREDIT_LOW',
        'SYSTEM',
        v_tenant.tenant_id,
        'Low SMS credit alert: ' || COALESCE(v_tenant.sms_balance::text, '0') || ' credits remaining',
        jsonb_build_object(
          'tenant_id', v_tenant.tenant_id,
          'hotel_name', v_tenant.hotel_name,
          'balance', COALESCE(v_tenant.sms_balance, 0),
          'alert_level', v_tenant.alert_level,
          'threshold', CASE WHEN v_tenant.alert_level = 'critical' THEN 10 ELSE 50 END
        )
      );

      IF v_tenant.alert_level = 'critical' THEN
        critical_balance_count := critical_balance_count + 1;
      ELSE
        low_balance_count := low_balance_count + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other tenants
      RAISE WARNING 'Failed to log SMS credit alert for tenant %: %', v_tenant.tenant_id, SQLERRM;
    END;
  END LOOP;

  -- Update log with success
  UPDATE public.background_job_logs
  SET status = 'success',
      completed_at = now(),
      execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer,
      rows_affected = low_balance_count + critical_balance_count,
      metadata = jsonb_build_object(
        'low_balance_count', low_balance_count,
        'critical_balance_count', critical_balance_count,
        'total_alerts', low_balance_count + critical_balance_count
      )
  WHERE id = log_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'low_balance_count', low_balance_count,
    'critical_balance_count', critical_balance_count
  );

EXCEPTION WHEN OTHERS THEN
  -- Update log with error
  UPDATE public.background_job_logs
  SET status = 'failed',
      completed_at = now(),
      execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer,
      error_message = SQLERRM
  WHERE id = log_id;

  RETURN jsonb_build_object(
    'status', 'failed',
    'error', SQLERRM
  );
END;
$$;

-- Schedule SMS credit monitoring job (daily at 8 AM)
SELECT cron.schedule(
  'monitor-sms-credits',
  '0 8 * * *',
  $$
  SELECT public.monitor_sms_credits();
  $$
);

-- ===================================================================
-- ROLLBACK SCRIPT
-- ===================================================================
/*
-- Unschedule the job
SELECT cron.unschedule('monitor-sms-credits');

-- Drop the function
DROP FUNCTION IF EXISTS public.monitor_sms_credits();
*/