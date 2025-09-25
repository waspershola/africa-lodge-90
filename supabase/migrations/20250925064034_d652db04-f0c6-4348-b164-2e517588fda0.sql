-- Create pricing_rules table for dynamic pricing
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('occupancy', 'demand', 'seasonal', 'competitor', 'event')),
  is_active boolean NOT NULL DEFAULT true,
  trigger_condition text NOT NULL,
  trigger_value numeric NOT NULL,
  trigger_operator text NOT NULL CHECK (trigger_operator IN ('>', '<', '=', '>=', '<=')),
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed')),
  adjustment_value numeric NOT NULL,
  max_increase numeric NOT NULL DEFAULT 50,
  max_decrease numeric NOT NULL DEFAULT 30,
  room_categories text[] NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create dynamic_pricing_settings table
CREATE TABLE IF NOT EXISTS public.dynamic_pricing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  update_frequency integer NOT NULL DEFAULT 30,
  max_price_increase numeric NOT NULL DEFAULT 50,
  max_price_decrease numeric NOT NULL DEFAULT 30,
  competitor_sync boolean NOT NULL DEFAULT false,
  demand_forecast boolean NOT NULL DEFAULT false,
  event_integration boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pricing_rules
CREATE POLICY "Pricing rules accessible by tenant" 
ON public.pricing_rules 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Create RLS policies for dynamic_pricing_settings
CREATE POLICY "Dynamic pricing settings accessible by tenant" 
ON public.dynamic_pricing_settings 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Add update triggers for updated_at
CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_settings_updated_at
BEFORE UPDATE ON public.dynamic_pricing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();