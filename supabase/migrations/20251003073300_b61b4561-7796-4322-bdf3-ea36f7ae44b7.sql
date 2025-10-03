-- Phase 3: Multi-Device Session Management (Fixed FK reference)
--
-- Creates infrastructure for tracking active user sessions across devices
-- with role-based expiry, heartbeat monitoring, and remote revocation.

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Session identification
  session_token TEXT NOT NULL UNIQUE,
  refresh_token_id TEXT,
  
  -- Device & location tracking
  device_fingerprint JSONB DEFAULT '{}',
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Session lifecycle
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT,
  
  -- Role-based session configuration
  user_role TEXT NOT NULL,
  max_idle_hours INTEGER NOT NULL DEFAULT 12,
  
  -- Session state
  is_active BOOLEAN NOT NULL DEFAULT true,
  heartbeat_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Add indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_tenant_id ON public.user_sessions(tenant_id);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sessions (via app)
CREATE POLICY "Users can create own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions (heartbeat)
CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Super admins can view all sessions
CREATE POLICY "Super admins can view all sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (is_super_admin());

-- Super admins can revoke any session
CREATE POLICY "Super admins can revoke sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Function: Auto-expire stale sessions
CREATE OR REPLACE FUNCTION public.expire_stale_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.user_sessions
  SET 
    is_active = false,
    revoked_at = now(),
    revocation_reason = 'Auto-expired due to inactivity'
  WHERE 
    is_active = true
    AND (
      last_activity_at < (now() - (max_idle_hours || ' hours')::INTERVAL)
      OR
      expires_at < now()
    );
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Function: Get active session count for user
CREATE OR REPLACE FUNCTION public.get_active_session_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.user_sessions
    WHERE user_id = p_user_id
      AND is_active = true
      AND expires_at > now()
  );
END;
$$;

-- Function: Revoke all sessions for user (force logout)
CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Forced logout'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  IF NOT (is_super_admin() OR auth.uid() = p_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  UPDATE public.user_sessions
  SET 
    is_active = false,
    revoked_at = now(),
    revoked_by = auth.uid(),
    revocation_reason = p_reason
  WHERE 
    user_id = p_user_id
    AND is_active = true;
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  INSERT INTO public.audit_log (
    action,
    resource_type,
    resource_id,
    actor_id,
    description,
    metadata
  ) VALUES (
    'SESSION_REVOKE_ALL',
    'USER_SESSION',
    p_user_id,
    auth.uid(),
    'All user sessions revoked',
    jsonb_build_object(
      'revoked_count', revoked_count,
      'reason', p_reason
    )
  );
  
  RETURN revoked_count;
END;
$$;

-- Function: Clean up old sessions (retention: 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions
  WHERE created_at < (now() - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Trigger: Update last_activity_at on session updates
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.heartbeat_count > OLD.heartbeat_count THEN
    NEW.last_activity_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_session_activity
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_session_activity();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_session_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_all_user_sessions(UUID, TEXT) TO authenticated;

-- Comments
COMMENT ON TABLE public.user_sessions IS 'Tracks active user sessions across devices with heartbeat monitoring';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Unique identifier for this session';
COMMENT ON COLUMN public.user_sessions.last_activity_at IS 'Updated by heartbeat every 5 minutes';
COMMENT ON COLUMN public.user_sessions.max_idle_hours IS 'Role-based max idle time (Front Desk: 12h, Owner: 4h, etc.)';