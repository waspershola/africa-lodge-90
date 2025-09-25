-- Add email provider configuration to hotel_settings
ALTER TABLE public.hotel_settings 
ADD COLUMN email_provider_config jsonb DEFAULT '{
  "default_provider": "ses",
  "providers": {
    "ses": {
      "enabled": true,
      "region": "us-east-1",
      "access_key_id": "",
      "secret_access_key": "",
      "verified_domains": []
    },
    "mailersend": {
      "enabled": false,
      "api_key": "",
      "verified_domains": []
    },
    "resend": {
      "enabled": false,
      "api_key": "",
      "verified_domains": []
    }
  },
  "fallback_enabled": true,
  "fallback_provider": "mailersend"
}'::jsonb;

-- Create email provider logs table for monitoring
CREATE TABLE public.email_provider_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  provider text NOT NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on email provider logs
ALTER TABLE public.email_provider_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for email provider logs
CREATE POLICY "Email provider logs accessible by tenant" 
ON public.email_provider_logs 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Create index for performance
CREATE INDEX idx_email_provider_logs_tenant_created ON public.email_provider_logs(tenant_id, created_at DESC);
CREATE INDEX idx_email_provider_logs_status ON public.email_provider_logs(status, created_at DESC);