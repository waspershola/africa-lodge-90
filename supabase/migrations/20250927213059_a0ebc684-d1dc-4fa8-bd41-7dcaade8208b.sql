-- Create devices table for shift terminal locations
CREATE TABLE IF NOT EXISTS public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  slug text NOT NULL,
  location text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Create shift sessions table
CREATE TABLE IF NOT EXISTS public.shift_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  device_id uuid NULL REFERENCES public.devices(id),
  authorized_by uuid NULL,
  role text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NULL,
  status text NOT NULL DEFAULT 'active',
  cash_total numeric DEFAULT 0,
  pos_total numeric DEFAULT 0,
  handover_notes text,
  unresolved_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'disputed'))
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_devices_tenant_slug ON public.devices (tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_tenant_status ON public.shift_sessions (tenant_id, status, start_time);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_staff ON public.shift_sessions (staff_id, status);

-- RLS policies for devices
CREATE POLICY "Devices accessible by tenant" ON public.devices
  FOR ALL USING (can_access_tenant(tenant_id));

-- RLS policies for shift_sessions
CREATE POLICY "Shift sessions accessible by tenant" ON public.shift_sessions
  FOR ALL USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can update own active shift" ON public.shift_sessions
  FOR UPDATE USING (
    auth.uid() = staff_id AND status = 'active' AND can_access_tenant(tenant_id)
  );

-- Create updated_at trigger for devices
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for shift_sessions  
CREATE TRIGGER update_shift_sessions_updated_at
  BEFORE UPDATE ON public.shift_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for shift_sessions
ALTER TABLE public.shift_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_sessions;