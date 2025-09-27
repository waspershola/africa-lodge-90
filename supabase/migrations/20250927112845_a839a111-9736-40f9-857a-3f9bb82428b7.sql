-- Phase A: Foundation Enhancement - Database Schema Extensions

-- Enhanced plans table (extend existing)
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS included_sms_credits integer DEFAULT 0;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS sms_rate_per_credit numeric DEFAULT 0.50;

-- Add-ons catalog
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  addon_type text NOT NULL CHECK (addon_type IN ('sms_bundle', 'integration', 'customization', 'feature')),
  price numeric NOT NULL,
  is_recurring boolean DEFAULT false,
  billing_interval text DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly', 'one_time')),
  sms_credits_bonus integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on addons
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

-- Tenant active add-ons
CREATE TABLE IF NOT EXISTS public.tenant_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  auto_renew boolean DEFAULT false,
  quantity integer DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  UNIQUE(tenant_id, addon_id)
);

-- Enable RLS on tenant_addons
ALTER TABLE public.tenant_addons ENABLE ROW LEVEL SECURITY;

-- SMS credits tracking
CREATE TABLE IF NOT EXISTS public.sms_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  balance integer DEFAULT 0,
  total_purchased integer DEFAULT 0,
  total_used integer DEFAULT 0,
  last_topup_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS on sms_credits
ALTER TABLE public.sms_credits ENABLE ROW LEVEL SECURITY;

-- SMS usage logs
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  credits_used integer NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('plan_included', 'addon_purchase', 'manual_topup', 'usage')),
  source_id uuid,
  purpose text,
  recipient_phone text,
  message_preview text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  cost_per_credit numeric DEFAULT 0.50,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sms_logs
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for addons
CREATE POLICY "Addons are viewable by authenticated users" 
ON public.addons FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin can manage addons" 
ON public.addons FOR ALL 
USING (is_super_admin());

-- RLS Policies for tenant_addons
CREATE POLICY "Tenant addons accessible by tenant" 
ON public.tenant_addons FOR ALL 
USING (can_access_tenant(tenant_id));

-- RLS Policies for sms_credits
CREATE POLICY "SMS credits accessible by tenant" 
ON public.sms_credits FOR ALL 
USING (can_access_tenant(tenant_id));

-- RLS Policies for sms_logs
CREATE POLICY "SMS logs accessible by tenant" 
ON public.sms_logs FOR ALL 
USING (can_access_tenant(tenant_id));

-- Function to provision SMS credits
CREATE OR REPLACE FUNCTION public.provision_sms_credits(
  p_tenant_id uuid,
  p_credits integer,
  p_source_type text,
  p_source_id uuid DEFAULT NULL,
  p_purpose text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update SMS credits
  INSERT INTO public.sms_credits (tenant_id, balance, total_purchased, last_topup_at)
  VALUES (p_tenant_id, p_credits, p_credits, now())
  ON CONFLICT (tenant_id) 
  DO UPDATE SET 
    balance = sms_credits.balance + p_credits,
    total_purchased = sms_credits.total_purchased + p_credits,
    last_topup_at = now(),
    updated_at = now();
  
  -- Log the credit addition
  INSERT INTO public.sms_logs (
    tenant_id, credits_used, source_type, source_id, purpose, status
  ) VALUES (
    p_tenant_id, -p_credits, p_source_type, p_source_id, p_purpose, 'sent'
  );
END;
$$;

-- Function to consume SMS credits
CREATE OR REPLACE FUNCTION public.consume_sms_credits(
  p_tenant_id uuid,
  p_credits integer,
  p_purpose text DEFAULT NULL,
  p_recipient_phone text DEFAULT NULL,
  p_message_preview text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Check current balance
  SELECT balance INTO current_balance 
  FROM public.sms_credits 
  WHERE tenant_id = p_tenant_id;
  
  -- If no record exists or insufficient balance, return false
  IF current_balance IS NULL OR current_balance < p_credits THEN
    RETURN false;
  END IF;
  
  -- Deduct credits
  UPDATE public.sms_credits 
  SET 
    balance = balance - p_credits,
    total_used = total_used + p_credits,
    updated_at = now()
  WHERE tenant_id = p_tenant_id;
  
  -- Log the usage
  INSERT INTO public.sms_logs (
    tenant_id, credits_used, source_type, purpose, 
    recipient_phone, message_preview, status
  ) VALUES (
    p_tenant_id, p_credits, 'usage', p_purpose, 
    p_recipient_phone, p_message_preview, 'sent'
  );
  
  RETURN true;
END;
$$;

-- Function to get SMS credits balance
CREATE OR REPLACE FUNCTION public.get_sms_credits_balance(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT balance INTO current_balance 
  FROM public.sms_credits 
  WHERE tenant_id = p_tenant_id;
  
  RETURN COALESCE(current_balance, 0);
END;
$$;

-- Trigger to update plans table timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to addons table
CREATE TRIGGER update_addons_updated_at 
BEFORE UPDATE ON public.addons 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default SMS add-ons
INSERT INTO public.addons (name, description, addon_type, price, sms_credits_bonus, metadata) VALUES 
('SMS Bundle - 500 Credits', '500 SMS credits for notifications and alerts', 'sms_bundle', 1000, 500, '{"popular": false}'),
('SMS Bundle - 1000 Credits', '1000 SMS credits for notifications and alerts', 'sms_bundle', 1800, 1000, '{"popular": true}'),
('SMS Bundle - 2500 Credits', '2500 SMS credits for notifications and alerts', 'sms_bundle', 4000, 2500, '{"popular": false}'),
('SMS Bundle - 5000 Credits', '5000 SMS credits for notifications and alerts', 'sms_bundle', 7500, 5000, '{"popular": false}'),
('Custom Website Design', 'Professional website design and development', 'customization', 50000, 0, '{"deliverable": "website", "timeline": "2-3 weeks"}'),
('Booking.com Integration', 'Direct integration with Booking.com channel', 'integration', 15000, 0, '{"channel": "booking.com", "setup_required": true}'),
('Expedia Integration', 'Direct integration with Expedia channel', 'integration', 15000, 0, '{"channel": "expedia", "setup_required": true}')
ON CONFLICT (name) DO NOTHING;

-- Update existing plans with SMS credits
UPDATE public.plans SET 
  included_sms_credits = CASE 
    WHEN name ILIKE '%starter%' OR name ILIKE '%basic%' THEN 100
    WHEN name ILIKE '%pro%' OR name ILIKE '%standard%' THEN 500
    WHEN name ILIKE '%enterprise%' OR name ILIKE '%premium%' THEN 1000
    ELSE 50
  END,
  sms_rate_per_credit = 0.50
WHERE included_sms_credits IS NULL OR included_sms_credits = 0;