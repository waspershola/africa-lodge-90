-- Create system-wide email provider configuration for super admin
CREATE TABLE IF NOT EXISTS public.system_email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('ses', 'mailersend', 'resend')),
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_email_providers ENABLE ROW LEVEL SECURITY;

-- Create policy for super admin access only
CREATE POLICY "Super admin can manage system email providers"
ON public.system_email_providers
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Add system email preference to hotel_settings
ALTER TABLE public.hotel_settings 
ADD COLUMN IF NOT EXISTS use_system_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS system_provider_id UUID REFERENCES public.system_email_providers(id);

-- Insert default system providers
INSERT INTO public.system_email_providers (provider_name, provider_type, config, is_default) VALUES
('Amazon SES', 'ses', '{
  "region": "us-east-1",
  "access_key_id": "",
  "secret_access_key": "",
  "verified_domains": []
}', true),
('MailerSend', 'mailersend', '{
  "api_key": "",
  "verified_domains": []
}', false),
('Resend', 'resend', '{
  "api_key": "",
  "verified_domains": []
}', false);

-- Create function to get system default email provider
CREATE OR REPLACE FUNCTION public.get_system_default_email_provider()
RETURNS TABLE(provider_type TEXT, config JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT sep.provider_type, sep.config
  FROM system_email_providers sep
  WHERE sep.is_enabled = true 
    AND sep.is_default = true
  LIMIT 1;
END;
$$;