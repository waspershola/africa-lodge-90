-- Fix existing global user force_reset and temp password settings
UPDATE users 
SET 
  force_reset = true,
  temp_password_hash = 'TempPassword123!',
  temp_expires = NOW() + INTERVAL '24 hours'
WHERE email = 'lambadayadrive@gmail.com' 
  AND role = 'SUPPORT_ADMIN' 
  AND tenant_id IS NULL;