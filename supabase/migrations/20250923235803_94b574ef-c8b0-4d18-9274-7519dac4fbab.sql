-- Add theme column to qr_settings table
ALTER TABLE public.qr_settings 
ADD COLUMN theme VARCHAR(50) DEFAULT 'classic-luxury-gold';

-- Update existing records to have the default theme
UPDATE public.qr_settings 
SET theme = 'classic-luxury-gold' 
WHERE theme IS NULL;