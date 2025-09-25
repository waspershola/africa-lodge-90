-- Reset passwords for existing system owners to match temporary passwords
UPDATE auth.users 
SET encrypted_password = crypt('TempPass2024!', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'ceo@waspersolution.com';

UPDATE auth.users 
SET encrypted_password = crypt('TempPass2025!', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'waspershola@gmail.com';