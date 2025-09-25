-- Add recovery codes table for better management
CREATE TABLE IF NOT EXISTS public.recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 year'),
  UNIQUE(user_id, code_hash)
);

-- Enable RLS
ALTER TABLE public.recovery_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recovery codes
CREATE POLICY "Users can view their own recovery codes" 
ON public.recovery_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all recovery codes" 
ON public.recovery_codes 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Service role can manage recovery codes" 
ON public.recovery_codes 
FOR ALL 
USING (auth.role() = 'service_role');

-- Update the generate_recovery_codes function to use the new table
CREATE OR REPLACE FUNCTION public.generate_recovery_codes(user_uuid uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  codes TEXT[] := '{}';
  code TEXT;
  i INTEGER;
BEGIN
  -- Delete existing unused codes
  DELETE FROM public.recovery_codes 
  WHERE user_id = user_uuid AND used_at IS NULL;
  
  -- Generate 10 random recovery codes
  FOR i IN 1..10 LOOP
    code := upper(substring(gen_random_uuid()::text from 1 for 8));
    codes := array_append(codes, code);
    
    -- Store hashed version in database
    INSERT INTO public.recovery_codes (user_id, code_hash)
    VALUES (user_uuid, encode(digest(code, 'sha256'), 'hex'));
  END LOOP;
  
  -- Also update legacy storage in users table for compatibility
  UPDATE public.users 
  SET recovery_codes = codes,
      updated_at = now()
  WHERE id = user_uuid;
  
  RETURN codes;
END;
$function$;

-- Create function to validate recovery codes
CREATE OR REPLACE FUNCTION public.validate_recovery_code(user_uuid uuid, input_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  code_exists BOOLEAN := false;
BEGIN
  -- Check if code exists and is unused
  SELECT EXISTS(
    SELECT 1 FROM public.recovery_codes
    WHERE user_id = user_uuid 
    AND code_hash = encode(digest(upper(trim(input_code)), 'sha256'), 'hex')
    AND used_at IS NULL
  ) INTO code_exists;
  
  IF code_exists THEN
    -- Mark code as used
    UPDATE public.recovery_codes 
    SET used_at = now()
    WHERE user_id = user_uuid 
    AND code_hash = encode(digest(upper(trim(input_code)), 'sha256'), 'hex')
    AND used_at IS NULL;
    
    -- Also remove from legacy storage
    UPDATE public.users 
    SET recovery_codes = array_remove(recovery_codes, upper(trim(input_code)))
    WHERE id = user_uuid;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Create function to get available recovery codes count
CREATE OR REPLACE FUNCTION public.get_recovery_codes_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM public.recovery_codes
    WHERE user_id = user_uuid AND used_at IS NULL
  );
END;
$function$;