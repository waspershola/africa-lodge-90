-- Create temporary passwords for existing reset required users
DO $$
DECLARE
  ceo_password TEXT := 'TempPass2024!';
  shola_password TEXT := 'TempPass2025!';
BEGIN
  -- Update passwords for both users in auth system would require service role
  -- For now, let's add them to user metadata for reference
  UPDATE public.users 
  SET 
    temp_password_hash = encode(digest(ceo_password, 'sha256'), 'hex'),
    temp_expires = now() + interval '7 days',
    updated_at = now()
  WHERE email = 'ceo@waspersolution.com';
  
  UPDATE public.users 
  SET 
    temp_password_hash = encode(digest(shola_password, 'sha256'), 'hex'),
    temp_expires = now() + interval '7 days',
    updated_at = now()
  WHERE email = 'waspershola@gmail.com';
  
  -- Log the temporary passwords for the admin
  INSERT INTO public.audit_log (
    action, resource_type, description, metadata, created_at
  ) VALUES (
    'TEMP_PASSWORD_GENERATED', 
    'USER', 
    'Temporary passwords generated for system owners',
    jsonb_build_object(
      'ceo_email', 'ceo@waspersolution.com',
      'ceo_temp_password', ceo_password,
      'shola_email', 'waspershola@gmail.com', 
      'shola_temp_password', shola_password,
      'expires_at', (now() + interval '7 days')::text
    ),
    now()
  );
END $$;