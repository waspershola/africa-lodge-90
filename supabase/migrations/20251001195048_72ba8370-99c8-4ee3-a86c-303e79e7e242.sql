-- ===================================================================
-- Phase 3: Background Jobs Setup - pg_cron Scheduled Tasks
-- ===================================================================
-- Description: Create essential background jobs for automated operations
-- Note: Jobs are initially created but can be toggled via ff/background_jobs_enabled
-- Safety: All jobs are idempotent and have proper error handling

-- Step 1: Ensure pg_cron extension is available
-- (Extension should already be enabled via Supabase dashboard)

-- Step 2: Create helper function to check feature flag
CREATE OR REPLACE FUNCTION public.is_background_jobs_enabled()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flag_enabled boolean;
BEGIN
  SELECT is_enabled INTO flag_enabled
  FROM public.feature_flags
  WHERE flag_name = 'ff/background_jobs_enabled';
  
  RETURN COALESCE(flag_enabled, false);
END;
$$;

-- Step 3: Create job execution log table
CREATE TABLE IF NOT EXISTS public.background_job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running', -- running, success, failed
  rows_affected integer DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_logs_name_started
  ON public.background_job_logs (job_name, started_at DESC);

-- Step 4: Auto-checkout overdue reservations function
CREATE OR REPLACE FUNCTION public.process_auto_checkouts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  start_time timestamp := clock_timestamp();
  processed_count integer := 0;
  v_reservation record;
  v_folio record;
BEGIN
  -- Create log entry
  INSERT INTO public.background_job_logs (job_name, status)
  VALUES ('auto_checkout', 'running')
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

  -- Process overdue checked-in reservations (checkout time + 3 hours grace period)
  FOR v_reservation IN
    SELECT r.*, t.timezone
    FROM public.reservations r
    JOIN public.tenants t ON t.tenant_id = r.tenant_id
    WHERE r.status = 'checked_in'
      AND r.check_out_date < CURRENT_DATE
      AND r.check_out_date < CURRENT_DATE - INTERVAL '3 hours'
  LOOP
    BEGIN
      -- Get open folio for this reservation
      SELECT * INTO v_folio
      FROM public.folios
      WHERE reservation_id = v_reservation.id
        AND status = 'open'
      LIMIT 1;

      IF v_folio.id IS NOT NULL THEN
        -- Close the folio
        UPDATE public.folios
        SET status = 'closed',
            closed_at = now(),
            updated_at = now()
        WHERE id = v_folio.id;

        -- Update reservation status
        UPDATE public.reservations
        SET status = 'checked_out',
            checked_out_at = now(),
            updated_at = now()
        WHERE id = v_reservation.id;

        -- Update room status to dirty
        UPDATE public.rooms
        SET status = 'cleaning',
            updated_at = now()
        WHERE id = v_reservation.room_id;

        -- Log the auto-checkout
        INSERT INTO public.audit_log (
          action, resource_type, resource_id, tenant_id,
          description, metadata
        ) VALUES (
          'AUTO_CHECKOUT',
          'RESERVATION',
          v_reservation.id,
          v_reservation.tenant_id,
          'Automatic checkout processed for overdue reservation',
          jsonb_build_object(
            'reservation_id', v_reservation.id,
            'folio_id', v_folio.id,
            'checkout_date', v_reservation.check_out_date,
            'processed_date', CURRENT_DATE
          )
        );

        processed_count := processed_count + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other reservations
      RAISE WARNING 'Failed to auto-checkout reservation %: %', v_reservation.id, SQLERRM;
    END;
  END LOOP;

  -- Update log with success
  UPDATE public.background_job_logs
  SET status = 'success',
      completed_at = now(),
      execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer,
      rows_affected = processed_count,
      metadata = jsonb_build_object('processed_count', processed_count)
  WHERE id = log_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'processed_count', processed_count
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

-- Step 5: Materialized view refresh function
CREATE OR REPLACE FUNCTION public.refresh_revenue_views_safe()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  start_time timestamp := clock_timestamp();
BEGIN
  INSERT INTO public.background_job_logs (job_name, status)
  VALUES ('refresh_revenue_views', 'running')
  RETURNING id INTO log_id;

  IF NOT is_background_jobs_enabled() THEN
    UPDATE public.background_job_logs
    SET status = 'skipped', completed_at = now(),
        execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer
    WHERE id = log_id;
    RETURN jsonb_build_object('status', 'skipped');
  END IF;

  -- Refresh materialized views if they exist
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue_by_tenant;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh mv_daily_revenue_by_tenant: %', SQLERRM;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY folio_balances;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh folio_balances: %', SQLERRM;
  END;

  UPDATE public.background_job_logs
  SET status = 'success', completed_at = now(),
      execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer
  WHERE id = log_id;

  RETURN jsonb_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  UPDATE public.background_job_logs
  SET status = 'failed', completed_at = now(),
      error_message = SQLERRM,
      execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer
  WHERE id = log_id;
  RETURN jsonb_build_object('status', 'failed', 'error', SQLERRM);
END;
$$;

-- Step 6: Trial expiry monitoring function
CREATE OR REPLACE FUNCTION public.process_trial_expiry()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  start_time timestamp := clock_timestamp();
  expiring_count integer := 0;
BEGIN
  INSERT INTO public.background_job_logs (job_name, status)
  VALUES ('trial_expiry', 'running')
  RETURNING id INTO log_id;

  IF NOT is_background_jobs_enabled() THEN
    UPDATE public.background_job_logs
    SET status = 'skipped', completed_at = now()
    WHERE id = log_id;
    RETURN jsonb_build_object('status', 'skipped');
  END IF;

  -- Update expired trials
  UPDATE public.tenants
  SET subscription_status = 'expired',
      updated_at = now()
  WHERE subscription_status = 'trialing'
    AND trial_end < CURRENT_DATE;

  GET DIAGNOSTICS expiring_count = ROW_COUNT;

  UPDATE public.background_job_logs
  SET status = 'success', completed_at = now(),
      rows_affected = expiring_count,
      execution_time_ms = EXTRACT(MILLISECOND FROM clock_timestamp() - start_time)::integer
  WHERE id = log_id;

  RETURN jsonb_build_object('status', 'success', 'expired_count', expiring_count);
EXCEPTION WHEN OTHERS THEN
  UPDATE public.background_job_logs
  SET status = 'failed', completed_at = now(), error_message = SQLERRM
  WHERE id = log_id;
  RETURN jsonb_build_object('status', 'failed', 'error', SQLERRM);
END;
$$;

-- Step 7: Schedule the cron jobs (will be controlled by feature flag)
-- Note: These are scheduled but won't run unless ff/background_jobs_enabled is true

-- Auto-checkout: Every 30 minutes
SELECT cron.schedule(
  'auto-checkout-overdue',
  '*/30 * * * *',  -- Every 30 minutes
  $$SELECT public.process_auto_checkouts()$$
);

-- Refresh materialized views: Daily at 1 AM
SELECT cron.schedule(
  'refresh-revenue-views',
  '0 1 * * *',  -- 1 AM daily
  $$SELECT public.refresh_revenue_views_safe()$$
);

-- Trial expiry: Daily at 6 AM
SELECT cron.schedule(
  'check-trial-expiry',
  '0 6 * * *',  -- 6 AM daily
  $$SELECT public.process_trial_expiry()$$
);

-- ===================================================================
-- ROLLBACK SCRIPT
-- ===================================================================
/*
-- Unschedule cron jobs
SELECT cron.unschedule('auto-checkout-overdue');
SELECT cron.unschedule('refresh-revenue-views');
SELECT cron.unschedule('check-trial-expiry');

-- Drop functions
DROP FUNCTION IF EXISTS public.process_auto_checkouts();
DROP FUNCTION IF EXISTS public.refresh_revenue_views_safe();
DROP FUNCTION IF EXISTS public.process_trial_expiry();
DROP FUNCTION IF EXISTS public.is_background_jobs_enabled();

-- Drop table
DROP TABLE IF EXISTS public.background_job_logs;
*/