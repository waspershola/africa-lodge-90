-- Update AWS SES region to Europe (Stockholm)
UPDATE system_email_providers 
SET config = jsonb_set(config, '{region}', '"eu-north-1"')
WHERE provider_type = 'ses';