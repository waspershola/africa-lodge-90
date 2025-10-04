-- Fix RLS policies for background_job_logs table
-- Remove overly permissive policy that allows public read access

DROP POLICY IF EXISTS "Service role can manage job logs" ON public.background_job_logs;

-- Allow service role (backend functions) to INSERT job logs only
CREATE POLICY "Service role can insert job logs"
ON public.background_job_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow super admins and owners to view job logs
CREATE POLICY "Admins and owners can view job logs"
ON public.background_job_logs
FOR SELECT
TO authenticated
USING (
  is_super_admin() OR 
  get_user_role() = 'OWNER'
);

-- Create audit log entry for security fix
INSERT INTO public.audit_log (
  action,
  resource_type,
  description,
  metadata
) VALUES (
  'SECURITY_FIX',
  'RLS_POLICY',
  'Fixed publicly exposed background_job_logs table - restricted access to authenticated admins only',
  jsonb_build_object(
    'table', 'background_job_logs',
    'issue', 'PUBLIC_JOB_LOGS',
    'severity', 'error'
  )
);