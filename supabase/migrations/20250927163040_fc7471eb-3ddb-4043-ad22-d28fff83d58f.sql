-- Update Termii provider to use hotelpro sender ID as requested
UPDATE sms_providers 
SET sender_id = 'hotelpro', 
    updated_at = now()
WHERE provider_type = 'termii';