-- Add email configuration to hotel_settings
ALTER TABLE public.hotel_settings 
ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT '{
  "from_name": "",
  "from_email": "",
  "reply_to_email": "",
  "smtp_enabled": false,
  "smtp_config": {},
  "email_templates": {
    "confirmation": {
      "subject": "Reservation Confirmation - {{hotel_name}}",
      "enabled": true
    },
    "invoice": {
      "subject": "Invoice for Your Reservation - {{hotel_name}}",
      "enabled": true
    },
    "reminder": {
      "subject": "Payment Reminder - {{hotel_name}}",
      "enabled": true
    },
    "group_confirmation": {
      "subject": "Group Reservation Confirmation - {{hotel_name}}",
      "enabled": true
    }
  },
  "branding": {
    "header_color": "#2563eb",
    "accent_color": "#f59e0b",
    "footer_text": "Thank you for choosing us!"
  },
  "send_to_individuals": false
}'::JSONB;

-- Create email templates table for advanced customization
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('confirmation', 'invoice', 'reminder', 'group_confirmation', 'individual_confirmation')),
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, template_type)
);

-- Enable RLS on email templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for email templates
CREATE POLICY "Email templates accessible by tenant" ON public.email_templates
  FOR ALL USING (can_access_tenant(tenant_id));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_email_templates_tenant_type ON public.email_templates(tenant_id, template_type);