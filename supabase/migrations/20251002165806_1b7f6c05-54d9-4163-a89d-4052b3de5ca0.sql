-- Phase 1: Add missing tax configuration columns to hotel_settings
ALTER TABLE public.hotel_settings 
ADD COLUMN IF NOT EXISTS tax_inclusive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS service_charge_inclusive boolean DEFAULT false;

COMMENT ON COLUMN public.hotel_settings.tax_inclusive IS 'Whether VAT is included in prices (true) or added on top (false)';
COMMENT ON COLUMN public.hotel_settings.service_charge_inclusive IS 'Whether service charge is included in prices (true) or added on top (false)';