-- Fix RLS policies for recovery_sessions table to allow service role access
DROP POLICY IF EXISTS "System can create recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Users can manage their own recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Super admins can manage recovery sessions" ON recovery_sessions;

-- Create proper policies that allow service role access
CREATE POLICY "Allow service role full access to recovery sessions"
ON recovery_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow super admins to manage recovery sessions
CREATE POLICY "Super admins can manage recovery sessions"
ON recovery_sessions
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Allow users to view their own recovery sessions
CREATE POLICY "Users can view their own recovery sessions"
ON recovery_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix emergency_access_attempts table policies too
DROP POLICY IF EXISTS "System can create emergency access attempts" ON emergency_access_attempts;

CREATE POLICY "Allow service role full access to emergency access attempts"
ON emergency_access_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);