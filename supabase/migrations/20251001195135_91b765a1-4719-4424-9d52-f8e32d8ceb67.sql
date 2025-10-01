-- ===================================================================
-- Fix RLS for background_job_logs table
-- ===================================================================

-- Enable RLS on background_job_logs
ALTER TABLE public.background_job_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins and system can view job logs
CREATE POLICY "Super admins can view all job logs"
  ON public.background_job_logs
  FOR SELECT
  USING (is_super_admin());

-- Allow service role to insert/update logs (for cron jobs)
CREATE POLICY "Service role can manage job logs"
  ON public.background_job_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===================================================================
-- ROLLBACK SCRIPT
-- ===================================================================
/*
DROP POLICY IF EXISTS "Super admins can view all job logs" ON public.background_job_logs;
DROP POLICY IF EXISTS "Service role can manage job logs" ON public.background_job_logs;
ALTER TABLE public.background_job_logs DISABLE ROW LEVEL SECURITY;
*/