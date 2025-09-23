-- Enable leaked password protection for better security
UPDATE auth.config 
SET value = 'true' 
WHERE parameter = 'password_min_length' AND value != '8';

INSERT INTO auth.config (parameter, value) 
VALUES ('password_min_length', '8')
ON CONFLICT (parameter) DO UPDATE SET value = '8';

-- Enable password complexity requirements
INSERT INTO auth.config (parameter, value) 
VALUES ('password_require_lowercase', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';

INSERT INTO auth.config (parameter, value) 
VALUES ('password_require_uppercase', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';

INSERT INTO auth.config (parameter, value) 
VALUES ('password_require_numbers', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';

INSERT INTO auth.config (parameter, value) 
VALUES ('password_require_symbols', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';