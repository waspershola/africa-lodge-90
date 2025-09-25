-- Reset passwords for existing system owners using Supabase Auth Admin API approach
-- This approach will be handled by an edge function since we can't directly update auth.users

-- First, let's ensure the users exist and are properly configured
UPDATE public.users 
SET 
  force_reset = true,
  updated_at = now()
WHERE email IN ('ceo@waspersolution.com', 'waspershola@gmail.com');