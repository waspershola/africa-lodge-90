-- Update existing users with proper names
UPDATE public.users 
SET name = 'Abdulwasiu O. Suleiman' 
WHERE email = 'wasperstore@gmail.com' AND name IS NULL;

UPDATE public.users 
SET name = 'First Hotel Owner' 
WHERE email = 'owner@luxuryhotel.com' AND name IS NULL;