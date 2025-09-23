-- Create QR settings table for hotel branding and default services
CREATE TABLE public.qr_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  hotel_name text NOT NULL,
  hotel_logo_url text,
  primary_color text DEFAULT '#D4AF37',
  show_logo_on_qr boolean DEFAULT true,
  default_services text[] DEFAULT ARRAY['Wi-Fi', 'Room Service', 'Housekeeping'],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.qr_settings ENABLE ROW LEVEL SECURITY;

-- Allow staff to manage QR settings in own tenant
CREATE POLICY "Staff can manage QR settings in own tenant" 
ON public.qr_settings 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Allow public access to QR settings for guest services
CREATE POLICY "Public can read QR settings for guest services" 
ON public.qr_settings 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_qr_settings_updated_at
BEFORE UPDATE ON public.qr_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();