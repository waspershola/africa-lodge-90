-- Phase 2 Remediation: Rollback ff/atomic_checkin_v2 for controlled deployment
-- This flag should be disabled initially for staged rollout

UPDATE public.feature_flags 
SET 
  is_enabled = false,
  updated_at = now()
WHERE flag_name = 'ff/atomic_checkin_v2';

-- Verify feature flag states for deployment readiness
DO $$
DECLARE
  flag_status RECORD;
BEGIN
  FOR flag_status IN 
    SELECT flag_name, is_enabled 
    FROM public.feature_flags 
    WHERE flag_name IN (
      'ff/background_jobs_enabled',
      'ff/paginated_reservations', 
      'ff/sentry_enabled',
      'ff/atomic_checkin_v2'
    )
    ORDER BY flag_name
  LOOP
    RAISE NOTICE 'Feature Flag: % = %', flag_status.flag_name, flag_status.is_enabled;
  END LOOP;
END $$;