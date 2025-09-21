-- Enable leaked password protection for better security
-- This prevents users from using passwords that have been compromised in data breaches

-- Note: This setting is typically managed through the Supabase dashboard
-- but we'll document it here for reference

-- The user should enable this in the Supabase dashboard at:
-- Authentication > Settings > Password Strength > Leaked Password Protection

-- For now, let's ensure our password policies are documented
INSERT INTO audit_log (action, resource_type, description, metadata)
VALUES (
  'SECURITY_UPDATE',
  'AUTH_SETTINGS',
  'Documented need to enable leaked password protection in Supabase dashboard',
  jsonb_build_object(
    'recommended_action', 'Enable leaked password protection in Authentication settings',
    'dashboard_path', 'Authentication > Settings > Password Strength',
    'security_benefit', 'Prevents use of compromised passwords from data breaches',
    'timestamp', NOW()
  )
);