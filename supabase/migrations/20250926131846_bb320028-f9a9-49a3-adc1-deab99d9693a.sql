-- Clean up corrupted email provider configurations
UPDATE system_email_providers SET config = jsonb_build_object(
  'region', 'eu-north-1',
  'access_key_id', '',
  'secret_access_key', '',
  'verified_domains', '[]'::jsonb
) WHERE provider_type = 'ses';

-- Reset Resend configuration with verified domain for luxuryhotelpro.com
UPDATE system_email_providers SET 
  config = jsonb_build_object(
    'api_key', '',
    'verified_domains', '["luxuryhotelpro.com"]'::jsonb
  ),
  is_default = true,
  is_enabled = true
WHERE provider_type = 'resend';

-- Reset MailerSend configuration with verified domain for luxuryhotelpro.com  
UPDATE system_email_providers SET 
  config = jsonb_build_object(
    'api_key', '',
    'verified_domains', '["luxuryhotelpro.com"]'::jsonb
  ),
  is_default = false,
  is_enabled = true
WHERE provider_type = 'mailersend';

-- Set SES as not default
UPDATE system_email_providers SET 
  is_default = false,
  is_enabled = true
WHERE provider_type = 'ses';