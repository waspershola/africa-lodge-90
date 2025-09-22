-- Fix data integrity issues: Update NULL names for existing global users
UPDATE users 
SET name = COALESCE(name, 'Admin User ' || SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1))
WHERE tenant_id IS NULL AND name IS NULL;

-- Ensure consistent role field values for global users
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE tenant_id IS NULL AND role IS NULL;

-- Add unique constraint on email to prevent duplicates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_email_unique' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;