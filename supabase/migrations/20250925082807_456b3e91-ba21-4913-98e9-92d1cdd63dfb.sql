-- Add payment policy settings table
CREATE TABLE public.payment_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  policy_name TEXT NOT NULL DEFAULT 'Default Policy',
  deposit_percentage NUMERIC NOT NULL DEFAULT 30.0,
  payment_timing TEXT NOT NULL DEFAULT 'at_booking', -- 'at_booking', 'at_checkin', 'flexible'
  requires_deposit BOOLEAN NOT NULL DEFAULT true,
  auto_cancel_hours INTEGER DEFAULT 24, -- Auto-cancel if payment not received
  payment_methods_accepted JSONB NOT NULL DEFAULT '["cash", "card", "bank_transfer"]'::jsonb,
  late_payment_fee NUMERIC DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for payment policies
ALTER TABLE public.payment_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment policies accessible by tenant" 
ON public.payment_policies 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Add group reservations table
CREATE TABLE public.group_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  group_name TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  organizer_email TEXT,
  organizer_phone TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_rooms INTEGER NOT NULL DEFAULT 1,
  total_guests INTEGER NOT NULL DEFAULT 1,
  payment_mode TEXT NOT NULL DEFAULT 'organizer_pays', -- 'organizer_pays', 'split_individual', 'hybrid'
  status TEXT NOT NULL DEFAULT 'confirmed',
  special_requests TEXT,
  group_code TEXT UNIQUE, -- Generated code for guest self-assignment
  total_amount NUMERIC NOT NULL DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for group reservations
ALTER TABLE public.group_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group reservations accessible by tenant" 
ON public.group_reservations 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Add enhanced reservation payment tracking
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_policy_id UUID;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'; -- 'pending', 'partial', 'paid', 'overdue'
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS balance_due NUMERIC DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS group_reservation_id UUID;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Add reservation invoices table
CREATE TABLE public.reservation_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  reservation_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_type TEXT NOT NULL DEFAULT 'reservation', -- 'reservation', 'deposit', 'balance'
  amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  service_charge NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'cancelled'
  due_date DATE,
  payment_instructions TEXT,
  sent_to_email TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for invoices
ALTER TABLE public.reservation_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservation invoices accessible by tenant" 
ON public.reservation_invoices 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Add reservation communications log
CREATE TABLE public.reservation_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  reservation_id UUID,
  group_reservation_id UUID,
  communication_type TEXT NOT NULL, -- 'confirmation', 'reminder', 'invoice', 'update'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for communications
ALTER TABLE public.reservation_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservation communications accessible by tenant" 
ON public.reservation_communications 
FOR ALL 
USING (can_access_tenant(tenant_id));

-- Add triggers for updated_at
CREATE TRIGGER update_payment_policies_updated_at
  BEFORE UPDATE ON public.payment_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_reservations_updated_at
  BEFORE UPDATE ON public.group_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservation_invoices_updated_at
  BEFORE UPDATE ON public.reservation_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_reservations_payment_status ON public.reservations(payment_status);
CREATE INDEX idx_reservations_group_id ON public.reservations(group_reservation_id);
CREATE INDEX idx_invoices_reservation_id ON public.reservation_invoices(reservation_id);
CREATE INDEX idx_communications_reservation_id ON public.reservation_communications(reservation_id);

-- Insert default payment policy for existing tenants
INSERT INTO public.payment_policies (tenant_id, policy_name, is_default)
SELECT DISTINCT tenant_id, 'Default Policy', true
FROM public.reservations 
WHERE tenant_id IS NOT NULL
ON CONFLICT DO NOTHING;