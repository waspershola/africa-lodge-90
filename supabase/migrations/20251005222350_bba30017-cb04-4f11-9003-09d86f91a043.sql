-- Create sounds table to store available notification sounds
CREATE TABLE IF NOT EXISTS public.sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sound_type TEXT NOT NULL CHECK (sound_type IN ('alert-high', 'alert-medium', 'alert-critical', 'custom')),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sounds accessible by tenant"
  ON public.sounds
  FOR ALL
  USING (tenant_id IS NULL OR can_access_tenant(tenant_id));

-- Insert default sounds (global - no tenant)
INSERT INTO public.sounds (name, file_path, sound_type, description, is_default, tenant_id)
VALUES
  ('Ringtone 024 (Default)', '/sounds/alert-high.mp3', 'alert-high', 'Default high priority notification sound', true, NULL),
  ('New Notification', '/sounds/alert-medium.mp3', 'alert-medium', 'Standard notification sound', true, NULL),
  ('SMS Alert', '/sounds/alert-critical.mp3', 'alert-critical', 'Critical alert sound', true, NULL),
  ('Ringtone 193', '/sounds/alert-custom.mp3', 'custom', 'Alternative notification sound', false, NULL);

-- Create indexes
CREATE INDEX idx_sounds_tenant_id ON public.sounds(tenant_id);
CREATE INDEX idx_sounds_sound_type ON public.sounds(sound_type);
CREATE INDEX idx_sounds_is_default ON public.sounds(is_default) WHERE is_default = true;

-- Update audio_preferences to allow custom sound selection
ALTER TABLE public.audio_preferences 
ADD COLUMN IF NOT EXISTS custom_sound_high UUID REFERENCES public.sounds(id),
ADD COLUMN IF NOT EXISTS custom_sound_medium UUID REFERENCES public.sounds(id),
ADD COLUMN IF NOT EXISTS custom_sound_critical UUID REFERENCES public.sounds(id);