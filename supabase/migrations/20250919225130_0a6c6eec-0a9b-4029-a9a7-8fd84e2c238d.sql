-- Enable leaked password protection for better security
-- This helps prevent users from using compromised passwords

-- Update auth configuration to enable leaked password protection
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE id = 1;