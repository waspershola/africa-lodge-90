-- =====================================================
-- NOTIFICATION POLICY INTEGRATION PHASE 1
-- Enhanced Database Schema for SMS + Email Architecture
-- =====================================================

-- 1. Add front_desk_phone to hotel_settings for policy compliance
ALTER TABLE public.hotel_settings 
ADD COLUMN IF NOT EXISTS front_desk_phone text,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "reservation_created": {"guest_sms": true, "front_desk_sms": true},
  "payment_reminder": {"guest_sms": true},
  "booking_confirmed": {"guest_sms": true, "manager_email": true},
  "pre_arrival_reminder": {"guest_email": true},
  "payment_received": {"guest_sms": true},
  "housekeeping_request": {"staff_sms": true},
  "service_request": {"staff_sms": true, "guest_email": true},
  "checkout_reminder": {"guest_email": true},
  "outstanding_payment": {"guest_sms": true},
  "subscription_renewal": {"admin_sms_email": true}
}'::jsonb;

-- 2. Create notification_events table for event queue management
CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  event_type text NOT NULL,
  event_source text NOT NULL, -- 'reservation', 'housekeeping', 'payment', etc.
  source_id uuid, -- ID of the source record
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  scheduled_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of recipient objects
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels text[] NOT NULL DEFAULT ARRAY[]::text[], -- 'sms', 'email', 'in_app', 'push'
  delivery_results jsonb DEFAULT '{}'::jsonb,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. Create staff_alert_configs table
CREATE TABLE IF NOT EXISTS public.staff_alert_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  alert_type text NOT NULL,
  alert_name text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create staff_alerts table
CREATE TABLE IF NOT EXISTS public.staff_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  config_id uuid REFERENCES public.staff_alert_configs(id),
  alert_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'acknowledged', 'resolved'
  triggered_by uuid, -- System or user who triggered the alert
  acknowledged_by uuid,
  acknowledged_at timestamp with time zone,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  source_type text, -- 'reservation', 'housekeeping', 'maintenance', etc.
  source_id uuid, -- ID of the source record
  delivery_status jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 5. Create staff_alert_subscriptions table
CREATE TABLE IF NOT EXISTS public.staff_alert_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  preferences jsonb DEFAULT '{}'::jsonb, -- Time restrictions, etc.
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, user_id, alert_type)
);

-- 6. Create notification_channels table
CREATE TABLE IF NOT EXISTS public.notification_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  channel_type text NOT NULL, -- 'sms', 'email', 'in_app', 'push'
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'inactive', -- 'active', 'inactive', 'error'
  last_test_at timestamp with time zone,
  error_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, channel_type)
);

-- 7. Create notification_rules table for policy-based routing
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  rule_name text NOT NULL,
  event_type text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  routing_config jsonb NOT NULL, -- Defines who gets what via which channel
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0, -- Higher numbers = higher priority
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

-- Notification Events Policies
CREATE POLICY "Notification events accessible by tenant" ON public.notification_events
FOR ALL USING (can_access_tenant(tenant_id));

-- Staff Alert Configs Policies
CREATE POLICY "Alert configs accessible by tenant" ON public.staff_alert_configs
FOR ALL USING (can_access_tenant(tenant_id));

-- Staff Alerts Policies
CREATE POLICY "Staff alerts accessible by tenant" ON public.staff_alerts
FOR ALL USING (can_access_tenant(tenant_id));

-- Staff Alert Subscriptions Policies
CREATE POLICY "Alert subscriptions accessible by tenant" ON public.staff_alert_subscriptions
FOR ALL USING (can_access_tenant(tenant_id));

-- Notification Channels Policies
CREATE POLICY "Notification channels accessible by tenant" ON public.notification_channels
FOR ALL USING (can_access_tenant(tenant_id));

-- Notification Rules Policies
CREATE POLICY "Notification rules accessible by tenant" ON public.notification_rules
FOR ALL USING (can_access_tenant(tenant_id));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Notification Events Indexes
CREATE INDEX IF NOT EXISTS idx_notification_events_tenant_id ON public.notification_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_status ON public.notification_events(status);
CREATE INDEX IF NOT EXISTS idx_notification_events_scheduled_at ON public.notification_events(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_events_event_type ON public.notification_events(event_type);

-- Staff Alerts Indexes
CREATE INDEX IF NOT EXISTS idx_staff_alerts_tenant_id ON public.staff_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_alerts_status ON public.staff_alerts(status);
CREATE INDEX IF NOT EXISTS idx_staff_alerts_type ON public.staff_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_staff_alerts_created_at ON public.staff_alerts(created_at DESC);

-- Staff Alert Subscriptions Indexes
CREATE INDEX IF NOT EXISTS idx_staff_alert_subs_tenant_user ON public.staff_alert_subscriptions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_staff_alert_subs_active ON public.staff_alert_subscriptions(is_active);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Notification Events updated_at trigger
CREATE TRIGGER update_notification_events_updated_at
    BEFORE UPDATE ON public.notification_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Staff Alert Configs updated_at trigger  
CREATE TRIGGER update_staff_alert_configs_updated_at
    BEFORE UPDATE ON public.staff_alert_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Staff Alerts updated_at trigger
CREATE TRIGGER update_staff_alerts_updated_at
    BEFORE UPDATE ON public.staff_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Staff Alert Subscriptions updated_at trigger
CREATE TRIGGER update_staff_alert_subscriptions_updated_at
    BEFORE UPDATE ON public.staff_alert_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Notification Channels updated_at trigger
CREATE TRIGGER update_notification_channels_updated_at
    BEFORE UPDATE ON public.notification_channels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Notification Rules updated_at trigger
CREATE TRIGGER update_notification_rules_updated_at
    BEFORE UPDATE ON public.notification_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SAMPLE NOTIFICATION RULES FOR POLICY COMPLIANCE
-- =====================================================

-- Insert default notification rules based on the policy document
INSERT INTO public.notification_rules (tenant_id, rule_name, event_type, routing_config, is_active) 
SELECT 
  hs.tenant_id,
  'Reservation Created - Guest & Front Desk SMS',
  'reservation_created',
  '{
    "guest": {"channels": ["sms"], "template": "booking_received"},
    "front_desk": {"channels": ["sms"], "template": "new_booking_alert"}
  }'::jsonb,
  true
FROM public.hotel_settings hs
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_rules (tenant_id, rule_name, event_type, routing_config, is_active)
SELECT 
  hs.tenant_id,
  'Payment Reminder - Guest SMS Only',
  'payment_reminder',
  '{
    "guest": {"channels": ["sms"], "template": "payment_reminder"}
  }'::jsonb,
  true
FROM public.hotel_settings hs
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_rules (tenant_id, rule_name, event_type, routing_config, is_active)
SELECT 
  hs.tenant_id,
  'Booking Confirmed - Guest SMS & Manager Email',
  'booking_confirmed', 
  '{
    "guest": {"channels": ["sms"], "template": "booking_confirmed"},
    "manager": {"channels": ["email"], "template": "booking_confirmation_internal"}
  }'::jsonb,
  true
FROM public.hotel_settings hs
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_rules (tenant_id, rule_name, event_type, routing_config, is_active)
SELECT 
  hs.tenant_id,
  'Housekeeping Request - Staff SMS',
  'housekeeping_request',
  '{
    "housekeeping_staff": {"channels": ["sms"], "template": "cleaning_request"}
  }'::jsonb,
  true
FROM public.hotel_settings hs
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_rules (tenant_id, rule_name, event_type, routing_config, is_active)
SELECT 
  hs.tenant_id,
  'Outstanding Payment - Guest SMS',
  'outstanding_payment',
  '{
    "guest": {"channels": ["sms"], "template": "outstanding_balance"}
  }'::jsonb,
  true
FROM public.hotel_settings hs
ON CONFLICT DO NOTHING;