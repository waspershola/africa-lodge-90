-- ===================================================================
-- Phase 0: Initialize Critical Feature Flags for Production Hardening
-- ===================================================================
-- Description: Initialize feature flags to control rollout of production features
-- Safety: Simple INSERT operations with conflict handling
-- Rollback: DELETE statements at end of file

INSERT INTO public.feature_flags (flag_name, description, is_enabled, config, target_tenants, target_plans)
VALUES 
  ('ff/paginated_reservations', 'Enable pagination for reservations, rooms, and payments to improve performance', false, '{"default_limit": 50}'::jsonb, NULL, NULL),
  ('ff/atomic_checkin_v2', 'Enhanced atomic check-in operations with improved error handling and logging', true, '{"timeout_seconds": 30}'::jsonb, NULL, NULL),
  ('ff/background_jobs_enabled', 'Enable background cron jobs for automated tasks (checkout, reconciliation, etc)', false, '{}'::jsonb, NULL, NULL),
  ('ff/sentry_enabled', 'Enable Sentry error tracking and monitoring for production', false, '{}'::jsonb, NULL, NULL)
ON CONFLICT (flag_name) DO UPDATE SET
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  updated_at = now();

-- ===================================================================
-- ROLLBACK SCRIPT
-- ===================================================================
/*
DELETE FROM public.feature_flags 
WHERE flag_name IN (
  'ff/paginated_reservations',
  'ff/atomic_checkin_v2',
  'ff/background_jobs_enabled',
  'ff/sentry_enabled'
);
*/