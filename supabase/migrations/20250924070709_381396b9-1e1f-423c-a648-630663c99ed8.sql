-- Create QR session settings table for per-tenant configuration
CREATE TABLE public.qr_session_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_lifetime_hours INTEGER NOT NULL DEFAULT 24,
  allow_session_extension BOOLEAN DEFAULT true,
  require_phone_email BOOLEAN DEFAULT false,
  max_requests_per_hour INTEGER DEFAULT 50,
  enable_session_resume BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_tenant_session_settings UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.qr_session_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Session settings accessible by tenant" 
ON public.qr_session_settings 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Create guest sessions table for proper session management
CREATE TABLE public.guest_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  qr_code_id UUID,
  room_id UUID,
  guest_phone TEXT,
  guest_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  device_info JSONB DEFAULT '{}',
  request_count INTEGER DEFAULT 0,
  CONSTRAINT fk_guest_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
  CONSTRAINT fk_guest_sessions_qr_code FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id),
  CONSTRAINT fk_guest_sessions_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Enable RLS
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for guest sessions
CREATE POLICY "Allow guest session creation through service role" 
ON public.guest_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can view guest sessions in own tenant" 
ON public.guest_sessions 
FOR SELECT 
USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can manage guest sessions in own tenant" 
ON public.guest_sessions 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Add session_id to qr_orders table to link orders to sessions
ALTER TABLE public.qr_orders 
ADD COLUMN session_id UUID,
ADD CONSTRAINT fk_qr_orders_session FOREIGN KEY (session_id) REFERENCES guest_sessions(session_id);

-- Create index for performance
CREATE INDEX idx_guest_sessions_session_id ON guest_sessions(session_id);
CREATE INDEX idx_guest_sessions_tenant_active ON guest_sessions(tenant_id, is_active);
CREATE INDEX idx_guest_sessions_expires_at ON guest_sessions(expires_at);
CREATE INDEX idx_qr_orders_session_id ON qr_orders(session_id);

-- Create function to generate new guest session
CREATE OR REPLACE FUNCTION public.create_guest_session(
  p_tenant_id UUID,
  p_qr_code_id UUID,
  p_room_id UUID DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_lifetime_hours INTEGER;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get session lifetime from settings or use default
  SELECT session_lifetime_hours INTO v_lifetime_hours
  FROM qr_session_settings 
  WHERE tenant_id = p_tenant_id;
  
  IF v_lifetime_hours IS NULL THEN
    v_lifetime_hours := 24; -- Default 24 hours
  END IF;
  
  v_expires_at := now() + (v_lifetime_hours || ' hours')::INTERVAL;
  
  -- Create new session
  INSERT INTO guest_sessions (
    tenant_id, qr_code_id, room_id, expires_at, device_info
  ) VALUES (
    p_tenant_id, p_qr_code_id, p_room_id, v_expires_at, p_device_info
  ) RETURNING session_id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

-- Create function to validate and refresh session
CREATE OR REPLACE FUNCTION public.validate_guest_session(
  p_session_id UUID,
  p_increment_count BOOLEAN DEFAULT false
) RETURNS TABLE(
  is_valid BOOLEAN,
  tenant_id UUID,
  qr_code_id UUID,
  room_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  guest_phone TEXT,
  guest_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last activity and optionally increment request count
  IF p_increment_count THEN
    UPDATE guest_sessions 
    SET last_activity_at = now(), request_count = request_count + 1
    WHERE session_id = p_session_id AND is_active = true AND expires_at > now();
  ELSE
    UPDATE guest_sessions 
    SET last_activity_at = now()
    WHERE session_id = p_session_id AND is_active = true AND expires_at > now();
  END IF;
  
  -- Return session info
  RETURN QUERY
  SELECT 
    (gs.expires_at > now() AND gs.is_active) as is_valid,
    gs.tenant_id,
    gs.qr_code_id,
    gs.room_id,
    gs.expires_at,
    gs.guest_phone,
    gs.guest_email
  FROM guest_sessions gs
  WHERE gs.session_id = p_session_id;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_qr_session_settings_updated_at
  BEFORE UPDATE ON qr_session_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();