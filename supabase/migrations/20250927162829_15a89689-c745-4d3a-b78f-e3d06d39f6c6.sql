-- Update Termii provider to use approved sender ID
UPDATE sms_providers 
SET sender_id = 'TERMII', 
    health_status = 'healthy',
    updated_at = now()
WHERE provider_type = 'termii';