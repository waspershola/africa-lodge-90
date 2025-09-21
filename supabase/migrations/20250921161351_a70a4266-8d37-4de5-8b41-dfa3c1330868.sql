-- Create impersonations table for tracking Super Admin impersonation sessions
CREATE TABLE public.impersonations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  reason text NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.impersonations ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage impersonations
CREATE POLICY "Super admin can manage impersonations" ON public.impersonations
  FOR ALL
  TO authenticated
  USING (is_super_admin());

-- Create index for faster lookups
CREATE INDEX idx_impersonations_session_token ON public.impersonations(session_token);
CREATE INDEX idx_impersonations_original_user ON public.impersonations(original_user_id);
CREATE INDEX idx_impersonations_active ON public.impersonations(ended_at) WHERE ended_at IS NULL;