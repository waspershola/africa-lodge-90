-- Create demo_config table for real production data instead of mock data
CREATE TABLE IF NOT EXISTS public.demo_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'See LuxuryHotelSaaS in Action',
  description TEXT NOT NULL DEFAULT 'Watch how hotels worldwide are transforming their operations with our comprehensive management platform.',
  video_url TEXT NOT NULL DEFAULT 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  thumbnail_url TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Watch Full Demo',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_config ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage demo config (this is global configuration)
CREATE POLICY "Super admin can manage demo config" 
ON public.demo_config 
FOR ALL 
USING (is_super_admin());

-- Anyone can view demo config (for public display)
CREATE POLICY "Anyone can view demo config" 
ON public.demo_config 
FOR SELECT 
USING (enabled = true);

-- Insert initial demo config record
INSERT INTO public.demo_config (id, title, description, video_url, thumbnail_url, cta_text, enabled)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'See LuxuryHotelSaaS in Action',
  'Watch how hotels worldwide are transforming their operations with our comprehensive management platform.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  'Watch Full Demo',
  true
) ON CONFLICT (id) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_demo_config_updated_at
  BEFORE UPDATE ON public.demo_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();