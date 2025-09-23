-- Phase 1 Completion: Create guests and corporate_accounts tables
-- Create guests table for guest management
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  guest_id_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  id_type TEXT, -- passport, drivers_license, national_id
  id_number TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  vip_status TEXT DEFAULT 'regular', -- regular, gold, platinum, diamond
  preferences JSONB DEFAULT '{}',
  notes TEXT,
  total_stays INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_stay_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT guests_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create corporate_accounts table
CREATE TABLE IF NOT EXISTS public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30, -- days
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  discount_rate NUMERIC DEFAULT 0,
  billing_address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active', -- active, suspended, closed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_guests_tenant_id ON guests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_vip_status ON guests(tenant_id, vip_status);
CREATE INDEX IF NOT EXISTS idx_guests_last_stay ON guests(tenant_id, last_stay_date);

CREATE INDEX IF NOT EXISTS idx_corporate_accounts_tenant_id ON corporate_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_company ON corporate_accounts(tenant_id, company_name);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_status ON corporate_accounts(tenant_id, status);

-- Enable RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guests
CREATE POLICY "Guests visible to tenant staff" ON public.guests
  FOR SELECT USING (get_user_tenant_id() = tenant_id);

CREATE POLICY "Staff can manage guests" ON public.guests
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER', 'FRONT_DESK') 
    AND get_user_tenant_id() = tenant_id
  );

-- RLS Policies for corporate accounts
CREATE POLICY "Corporate accounts visible to tenant staff" ON public.corporate_accounts
  FOR SELECT USING (get_user_tenant_id() = tenant_id);

CREATE POLICY "Management can manage corporate accounts" ON public.corporate_accounts
  FOR ALL USING (
    get_user_role() IN ('OWNER', 'MANAGER') 
    AND get_user_tenant_id() = tenant_id
  );

-- Add foreign key relationship between reservations and guests
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id);

-- Create index for this relationship
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);

-- Enable realtime for new tables
ALTER TABLE guests REPLICA IDENTITY FULL;
ALTER TABLE corporate_accounts REPLICA IDENTITY FULL;

-- Add to realtime publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE guests;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE corporate_accounts;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;