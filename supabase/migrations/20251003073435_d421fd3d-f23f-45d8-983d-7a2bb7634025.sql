-- Add helper function for session heartbeat
CREATE OR REPLACE FUNCTION public.increment_session_heartbeat(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
  SET heartbeat_count = heartbeat_count + 1
  WHERE id = p_session_id
    AND is_active = true
    AND expires_at > now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_session_heartbeat(UUID) TO authenticated;