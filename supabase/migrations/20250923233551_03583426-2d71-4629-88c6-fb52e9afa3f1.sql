-- Add front_desk_phone column to qr_settings table
ALTER TABLE public.qr_settings 
ADD COLUMN front_desk_phone text DEFAULT '+2347065937769';

-- Update existing records with the default phone number
UPDATE public.qr_settings 
SET front_desk_phone = '+2347065937769' 
WHERE front_desk_phone IS NULL;