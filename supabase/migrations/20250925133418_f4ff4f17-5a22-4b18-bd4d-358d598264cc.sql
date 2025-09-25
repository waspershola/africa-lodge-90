-- Fix System Email Provider Configurations
-- Update Resend provider to use correct API key from secrets
UPDATE system_email_providers 
SET config = jsonb_build_object(
  'api_key', 'RESEND_API_KEY_SECRET',
  'verified_domains', ARRAY[]::text[]
)
WHERE provider_type = 'resend';

-- Ensure MailerSend has proper configuration
UPDATE system_email_providers 
SET config = jsonb_build_object(
  'api_key', config->>'api_key',
  'verified_domains', ARRAY[]::text[]
)
WHERE provider_type = 'mailersend';

-- Update SES configuration to be more robust
UPDATE system_email_providers 
SET config = jsonb_build_object(
  'region', COALESCE(config->>'region', 'us-east-1'),
  'access_key_id', config->>'access_key_id',
  'secret_access_key', config->>'secret_access_key', 
  'verified_domains', ARRAY[]::text[]
)
WHERE provider_type = 'ses';