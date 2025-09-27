-- Phase 1: SMS Management System Database Infrastructure

-- Create SMS providers table for platform-level provider configurations
CREATE TABLE public.sms_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'termii', 'africastalking', 'twilio'
  api_key TEXT,
  api_secret TEXT,
  sender_id TEXT,
  base_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 1, -- Lower number = higher priority
  failover_provider_id UUID REFERENCES public.sms_providers(id),
  cost_per_sms NUMERIC DEFAULT 0,
  delivery_rate NUMERIC DEFAULT 0, -- Percentage 0-100
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status TEXT DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
  config JSONB DEFAULT '{}', -- Provider-specific configuration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS templates table for global and tenant-specific templates
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID, -- NULL for global templates
  template_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'booking_confirmed', 'payment_received', 'qr_request', etc.
  message_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_global BOOLEAN NOT NULL DEFAULT false, -- true for super admin templates
  allow_tenant_override BOOLEAN NOT NULL DEFAULT true,
  variables JSONB DEFAULT '[]', -- Array of required variables
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, template_name, event_type)
);

-- Create SMS notification settings for tenant preferences
CREATE TABLE public.sms_notifications_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  template_id UUID REFERENCES public.sms_templates(id),
  send_to_guest BOOLEAN NOT NULL DEFAULT true,
  send_to_staff BOOLEAN NOT NULL DEFAULT false,
  delay_minutes INTEGER DEFAULT 0, -- Delay before sending
  conditions JSONB DEFAULT '{}', -- Additional conditions for sending
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, event_type)
);

-- Create SMS staff alerts configuration
CREATE TABLE public.sms_staff_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  role TEXT,
  alert_types TEXT[] DEFAULT '{}', -- Array of alert types they receive
  is_on_duty BOOLEAN NOT NULL DEFAULT true,
  shift_start TIME,
  shift_end TIME,
  night_shift BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, staff_id)
);

-- Enhance existing sms_logs table
ALTER TABLE public.sms_logs 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.sms_providers(id),
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.sms_templates(id),
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'pending'
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_providers_enabled ON public.sms_providers(is_enabled, priority);
CREATE INDEX IF NOT EXISTS idx_sms_templates_tenant_event ON public.sms_templates(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant_date ON public.sms_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider ON public.sms_logs(provider_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_sms_staff_alerts_tenant ON public.sms_staff_alerts(tenant_id, is_active);

-- Enable RLS
ALTER TABLE public.sms_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notifications_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_staff_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_providers (Super Admin only)
CREATE POLICY "Super admin can manage SMS providers" 
ON public.sms_providers 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Authenticated users can view enabled providers" 
ON public.sms_providers 
FOR SELECT 
USING (is_enabled = true AND auth.uid() IS NOT NULL);

-- RLS Policies for sms_templates
CREATE POLICY "Super admin can manage all templates" 
ON public.sms_templates 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Tenants can manage their own templates" 
ON public.sms_templates 
FOR ALL 
USING (can_access_tenant(tenant_id) AND tenant_id IS NOT NULL);

CREATE POLICY "Everyone can view global templates" 
ON public.sms_templates 
FOR SELECT 
USING (is_global = true AND is_active = true);

-- RLS Policies for sms_notifications_settings
CREATE POLICY "Tenants can manage their SMS settings" 
ON public.sms_notifications_settings 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- RLS Policies for sms_staff_alerts
CREATE POLICY "Tenants can manage their staff alerts" 
ON public.sms_staff_alerts 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Insert default SMS providers
INSERT INTO public.sms_providers (name, provider_type, base_url, is_enabled, is_default, priority) VALUES
('Termii', 'termii', 'https://api.ng.termii.com', true, true, 1),
('Africa''s Talking', 'africastalking', 'https://api.africastalking.com', false, false, 2),
('Twilio', 'twilio', 'https://api.twilio.com', false, false, 3);

-- Insert default global SMS templates
INSERT INTO public.sms_templates (template_name, event_type, message_template, is_global, allow_tenant_override, variables) VALUES
('Booking Confirmation', 'booking_confirmed', 'Hi {guest_name}, your booking at {hotel_name} for {room_type} from {check_in_date} to {check_out_date} is confirmed. Reference: {reservation_number}', true, true, '["guest_name", "hotel_name", "room_type", "check_in_date", "check_out_date", "reservation_number"]'),
('Payment Confirmation', 'payment_received', 'We received your payment of {currency}{amount} for your reservation at {hotel_name}. Thank you! Reference: {payment_reference}', true, true, '["amount", "currency", "hotel_name", "payment_reference"]'),
('QR Service Request', 'qr_request_staff', 'Service request from Room {room_number}: {service_type}. Guest: {guest_name}. Message: {message}', true, true, '["room_number", "service_type", "guest_name", "message"]'),
('Check-in Reminder', 'check_in_reminder', 'Hi {guest_name}, your check-in at {hotel_name} is today at {check_in_time}. We look forward to welcoming you!', true, true, '["guest_name", "hotel_name", "check_in_time"]'),
('Low Credit Alert', 'low_credits', 'SMS credits are running low for {hotel_name}. Current balance: {credits_remaining}. Please top up to continue sending notifications.', true, false, '["hotel_name", "credits_remaining"]');

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sms_providers_updated_at BEFORE UPDATE ON public.sms_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON public.sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_notifications_settings_updated_at BEFORE UPDATE ON public.sms_notifications_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_staff_alerts_updated_at BEFORE UPDATE ON public.sms_staff_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();