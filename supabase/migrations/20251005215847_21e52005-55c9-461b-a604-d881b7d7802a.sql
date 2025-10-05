-- Create staff notifications table
CREATE TABLE IF NOT EXISTS public.staff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Message details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'reservation', 'guest_request', 'payment', 'maintenance', 'checkout', 'checkin', 'alert'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  sound_type TEXT NOT NULL DEFAULT 'alert-medium', -- 'alert-high', 'alert-medium', 'alert-critical', 'none'
  
  -- Routing
  department TEXT, -- 'FRONT_DESK', 'RESTAURANT', 'HOUSEKEEPING', 'MAINTENANCE', 'MANAGER', 'ACCOUNTS'
  recipients JSONB DEFAULT '[]'::jsonb, -- Array of role names or user IDs
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'acknowledged', 'completed', 'escalated'
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES public.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.users(id),
  
  -- Escalation
  escalate_after_minutes INTEGER DEFAULT 5,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_to UUID REFERENCES public.users(id),
  
  -- References
  reference_type TEXT, -- 'reservation', 'qr_order', 'payment', 'maintenance_task', 'housekeeping_task'
  reference_id UUID,
  
  -- Actions
  actions JSONB DEFAULT '[]'::jsonb, -- Array of available actions like ["acknowledge", "view_details", "assign"]
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_staff_notifications_tenant ON public.staff_notifications(tenant_id);
CREATE INDEX idx_staff_notifications_status ON public.staff_notifications(status);
CREATE INDEX idx_staff_notifications_department ON public.staff_notifications(department);
CREATE INDEX idx_staff_notifications_created ON public.staff_notifications(created_at DESC);
CREATE INDEX idx_staff_notifications_priority ON public.staff_notifications(priority);
CREATE INDEX idx_staff_notifications_reference ON public.staff_notifications(reference_type, reference_id);

-- Enable RLS
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view notifications for their tenant"
ON public.staff_notifications
FOR SELECT
USING (can_access_tenant(tenant_id));

CREATE POLICY "Staff can create notifications"
ON public.staff_notifications
FOR INSERT
WITH CHECK (can_access_tenant(tenant_id));

CREATE POLICY "Staff can update notifications in their tenant"
ON public.staff_notifications
FOR UPDATE
USING (can_access_tenant(tenant_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_notifications;

-- Function to auto-escalate notifications
CREATE OR REPLACE FUNCTION public.escalate_unacknowledged_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Find notifications that need escalation
  UPDATE public.staff_notifications
  SET 
    status = 'escalated',
    escalated_at = now(),
    metadata = metadata || jsonb_build_object('auto_escalated', true, 'escalated_reason', 'No acknowledgment within time limit')
  WHERE 
    status = 'pending'
    AND escalate_after_minutes IS NOT NULL
    AND created_at + (escalate_after_minutes || ' minutes')::interval < now()
    AND escalated_at IS NULL;
END;
$$;

-- Create a notification delivery log table
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.staff_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivery_method TEXT NOT NULL, -- 'realtime', 'push', 'email', 'sms'
  delivery_status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  
  device_info JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  read_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notification_delivery_log_notification ON public.notification_delivery_log(notification_id);
CREATE INDEX idx_notification_delivery_log_user ON public.notification_delivery_log(user_id);

ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery logs"
ON public.notification_delivery_log
FOR SELECT
USING (user_id = auth.uid() OR is_super_admin());