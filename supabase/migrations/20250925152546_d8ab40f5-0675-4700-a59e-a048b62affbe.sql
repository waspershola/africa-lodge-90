-- Enhanced Security System: Emergency Access Portal and Recovery Features

-- 1. Add enhanced security fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS security_questions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS recovery_codes TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS backup_email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS backup_phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false;

-- 2. Create emergency access attempts table for audit trail
CREATE TABLE IF NOT EXISTS public.emergency_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  attempt_type TEXT NOT NULL, -- 'master_key', 'security_question', 'recovery_code', 'sms', 'email'
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint JSONB DEFAULT '{}'::jsonb,
  verification_data JSONB DEFAULT '{}'::jsonb,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create recovery sessions table for multi-step verification
CREATE TABLE IF NOT EXISTS public.recovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  session_token TEXT UNIQUE NOT NULL,
  steps_completed JSONB DEFAULT '[]'::jsonb,
  required_steps JSONB NOT NULL DEFAULT '["email_verification", "master_key", "security_question"]'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  completed BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create system owner emergency contacts table
CREATE TABLE IF NOT EXISTS public.system_owner_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) UNIQUE,
  primary_email TEXT NOT NULL,
  backup_email TEXT,
  phone_number TEXT,
  emergency_phone TEXT,
  recovery_contact_name TEXT,
  recovery_contact_email TEXT,
  recovery_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Add more system owner slots and update existing platform owner
INSERT INTO public.users (
  email, 
  role, 
  name, 
  is_platform_owner, 
  tenant_id,
  is_active
) VALUES 
('backup-admin1@luxuryhotelpro.com', 'SUPER_ADMIN', 'Backup System Administrator 1', true, null, true),
('backup-admin2@luxuryhotelpro.com', 'SUPER_ADMIN', 'Backup System Administrator 2', true, null, false)
ON CONFLICT (email) DO NOTHING;

-- 6. Initialize security settings for existing platform owner
UPDATE public.users 
SET 
  security_questions = '[
    {"question": "What was the name of your first hotel?", "answer_hash": null},
    {"question": "What city were you born in?", "answer_hash": null},
    {"question": "What was your first job title?", "answer_hash": null},
    {"question": "What is your favorite travel destination?", "answer_hash": null},
    {"question": "What was the name of your first business mentor?", "answer_hash": null}
  ]'::jsonb,
  backup_email = 'wasperstore.backup@gmail.com',
  emergency_contact_info = '{
    "name": "Emergency Contact",
    "email": "emergency@luxuryhotelpro.com",
    "phone": "+1234567890"
  }'::jsonb
WHERE email = 'wasperstore@gmail.com' AND is_platform_owner = true;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_access_attempts_user_id ON public.emergency_access_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_access_attempts_created_at ON public.emergency_access_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_user_id ON public.recovery_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_token ON public.recovery_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_expires_at ON public.recovery_sessions(expires_at);

-- 8. Enable RLS on new tables
ALTER TABLE public.emergency_access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_owner_contacts ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
CREATE POLICY "Super admins can manage emergency access attempts" 
ON public.emergency_access_attempts FOR ALL 
USING (is_super_admin());

CREATE POLICY "Users can view their own emergency access attempts" 
ON public.emergency_access_attempts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create emergency access attempts" 
ON public.emergency_access_attempts FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Super admins can manage recovery sessions" 
ON public.recovery_sessions FOR ALL 
USING (is_super_admin());

CREATE POLICY "Users can manage their own recovery sessions" 
ON public.recovery_sessions FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "System can create recovery sessions" 
ON public.recovery_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System owners can manage contacts" 
ON public.system_owner_contacts FOR ALL 
USING (auth.uid() = user_id OR is_super_admin());

-- 10. Create function to generate recovery codes
CREATE OR REPLACE FUNCTION generate_recovery_codes(user_uuid UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codes TEXT[] := '{}';
  i INTEGER;
BEGIN
  -- Generate 10 random recovery codes
  FOR i IN 1..10 LOOP
    codes := array_append(codes, upper(substring(gen_random_uuid()::text from 1 for 8)));
  END LOOP;
  
  -- Store hashed codes in user record
  UPDATE public.users 
  SET recovery_codes = codes
  WHERE id = user_uuid;
  
  RETURN codes;
END;
$$;

-- 11. Create function to validate recovery code
CREATE OR REPLACE FUNCTION validate_recovery_code(user_uuid UUID, input_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_codes TEXT[];
  code_valid BOOLEAN := false;
BEGIN
  SELECT recovery_codes INTO user_codes
  FROM public.users
  WHERE id = user_uuid;
  
  IF input_code = ANY(user_codes) THEN
    -- Remove used code
    UPDATE public.users 
    SET recovery_codes = array_remove(recovery_codes, input_code)
    WHERE id = user_uuid;
    
    code_valid := true;
  END IF;
  
  RETURN code_valid;
END;
$$;

-- 12. Create function to validate security question
CREATE OR REPLACE FUNCTION validate_security_answer(user_uuid UUID, question_text TEXT, answer_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  questions JSONB;
  question_item JSONB;
  stored_hash TEXT;
BEGIN
  SELECT security_questions INTO questions
  FROM public.users
  WHERE id = user_uuid;
  
  FOR question_item IN SELECT * FROM jsonb_array_elements(questions)
  LOOP
    IF question_item->>'question' = question_text THEN
      stored_hash := question_item->>'answer_hash';
      -- In production, use proper password hashing
      RETURN stored_hash IS NOT NULL AND stored_hash = encode(digest(lower(trim(answer_text)), 'sha256'), 'hex');
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;

-- 13. Create audit trigger for emergency access
CREATE OR REPLACE FUNCTION audit_emergency_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (
    action,
    resource_type,
    resource_id,
    actor_id,
    description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    'EMERGENCY_ACCESS_ATTEMPT',
    'SECURITY',
    NEW.user_id,
    NEW.user_id,
    'Emergency access attempt: ' || NEW.attempt_type,
    jsonb_build_object(
      'success', NEW.success,
      'attempt_type', NEW.attempt_type,
      'failure_reason', NEW.failure_reason
    ),
    NEW.ip_address,
    NEW.user_agent
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER emergency_access_audit_trigger
  AFTER INSERT ON public.emergency_access_attempts
  FOR EACH ROW
  EXECUTE FUNCTION audit_emergency_access();

-- 14. Create function to check if user is system owner
CREATE OR REPLACE FUNCTION is_system_owner(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_uuid 
    AND is_platform_owner = true 
    AND is_active = true
  );
END;
$$;