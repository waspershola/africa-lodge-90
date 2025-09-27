-- Complete database integration for Phase 2
-- Create staff_shifts table (retry with proper structure)
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night', 'full_day')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'missed')),
  handover_notes TEXT,
  handover_completed BOOLEAN DEFAULT false,
  handover_by UUID,
  handover_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audio_preferences table (retry with proper structure) 
CREATE TABLE IF NOT EXISTS public.audio_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notification_sounds BOOLEAN DEFAULT true,
  volume_level INTEGER DEFAULT 70 CHECK (volume_level >= 0 AND volume_level <= 100),
  sound_theme TEXT DEFAULT 'default' CHECK (sound_theme IN ('default', 'chime', 'bell', 'beep')),
  qr_request_sound BOOLEAN DEFAULT true,
  payment_sound BOOLEAN DEFAULT true,
  urgent_alert_sound BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Add RLS policies for staff_shifts
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view shifts in own tenant" ON public.staff_shifts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND tenant_id = staff_shifts.tenant_id)
);

CREATE POLICY "Management can manage shifts" ON public.staff_shifts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND tenant_id = staff_shifts.tenant_id 
    AND role IN ('OWNER', 'MANAGER')
  )
);

-- Add RLS policies for audio_preferences  
ALTER TABLE public.audio_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own audio preferences" ON public.audio_preferences
FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER TABLE public.staff_shifts REPLICA IDENTITY FULL;
ALTER TABLE public.audio_preferences REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_preferences;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_shifts_updated_at
    BEFORE UPDATE ON public.staff_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audio_preferences_updated_at
    BEFORE UPDATE ON public.audio_preferences  
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();