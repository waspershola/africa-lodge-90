-- Delete existing users to avoid conflicts and recreate them properly
DELETE FROM public.users WHERE email IN ('wasperstore@gmail.com', 'owner@luxuryhotel.com');