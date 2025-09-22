-- Add address field to users table if it doesn't exist
DO $$
BEGIN
  -- Check if address column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE public.users ADD COLUMN address TEXT;
    RAISE NOTICE 'Added address column to users table';
  ELSE
    RAISE NOTICE 'Address column already exists in users table';
  END IF;
END $$;