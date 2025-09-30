-- Create payment_methods table for tenant-specific configuration
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pos', 'digital', 'transfer', 'cash', 'credit')),
  icon TEXT NOT NULL DEFAULT 'CreditCard',
  enabled BOOLEAN NOT NULL DEFAULT true,
  fees JSONB DEFAULT '{"percentage": 0, "fixed": 0}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Payment methods accessible by tenant"
  ON public.payment_methods
  FOR ALL
  USING (can_access_tenant(tenant_id));

-- Create index for performance
CREATE INDEX idx_payment_methods_tenant_enabled ON public.payment_methods(tenant_id, enabled);

-- Add trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default payment methods for existing tenants
INSERT INTO public.payment_methods (tenant_id, name, type, icon, enabled, fees, display_order)
SELECT 
  t.tenant_id,
  method.name,
  method.type,
  method.icon,
  method.enabled,
  method.fees,
  method.display_order
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Cash', 'cash', 'Banknote', true, '{"percentage": 0, "fixed": 0}'::jsonb, 1),
    ('Moniepoint POS', 'pos', 'CreditCard', true, '{"percentage": 1.5, "fixed": 0}'::jsonb, 2),
    ('Opay POS', 'pos', 'CreditCard', true, '{"percentage": 1.5, "fixed": 0}'::jsonb, 3),
    ('Zenith Transfer', 'transfer', 'Building', true, '{"percentage": 0, "fixed": 25}'::jsonb, 4),
    ('Pay Later', 'credit', 'Clock', true, '{"percentage": 0, "fixed": 0}'::jsonb, 5)
) AS method(name, type, icon, enabled, fees, display_order)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Add payment_method_id to payments table for tracking
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method_id);

-- Add comment for documentation
COMMENT ON TABLE public.payment_methods IS 'Tenant-configurable payment methods for billing operations';