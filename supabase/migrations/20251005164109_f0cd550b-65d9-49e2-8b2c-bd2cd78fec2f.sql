-- Phase 3: Guest Wallet Support
-- Enable guests to maintain a prepaid wallet balance

-- Step 1: Create guest_wallets table
CREATE TABLE IF NOT EXISTS public.guest_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, guest_id)
);

-- Step 2: Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.guest_wallets(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'adjustment')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount != 0),
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT, -- 'payment', 'folio', 'reservation'
  reference_id UUID,
  payment_method TEXT, -- How the deposit was made (cash, pos, etc.)
  payment_method_id UUID REFERENCES public.payment_methods(id),
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 3: Enable RLS on both tables
ALTER TABLE public.guest_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies for guest_wallets
CREATE POLICY "Tenant staff can view wallets"
  ON public.guest_wallets FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant staff can manage wallets"
  ON public.guest_wallets FOR ALL
  TO authenticated
  USING (
    tenant_id = get_user_tenant_id() 
    AND get_user_role() = ANY(ARRAY['OWNER', 'MANAGER', 'FRONT_DESK'])
  );

-- Step 5: RLS Policies for wallet_transactions
CREATE POLICY "Tenant staff can view wallet transactions"
  ON public.wallet_transactions FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant staff can create wallet transactions"
  ON public.wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id() 
    AND get_user_role() = ANY(ARRAY['OWNER', 'MANAGER', 'FRONT_DESK', 'POS'])
  );

-- Step 6: Create function to process wallet transaction
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
  p_wallet_id UUID,
  p_transaction_type TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_method_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
  v_amount_change NUMERIC;
BEGIN
  -- Get wallet details with row lock
  SELECT * INTO v_wallet
  FROM public.guest_wallets
  WHERE id = p_wallet_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF NOT v_wallet.is_active THEN
    RAISE EXCEPTION 'Wallet is not active';
  END IF;
  
  -- Calculate amount change (deposits add, payments/withdrawals subtract)
  v_amount_change := CASE
    WHEN p_transaction_type IN ('deposit', 'refund') THEN ABS(p_amount)
    WHEN p_transaction_type IN ('withdrawal', 'payment') THEN -ABS(p_amount)
    WHEN p_transaction_type = 'adjustment' THEN p_amount
    ELSE 0
  END;
  
  v_new_balance := v_wallet.balance + v_amount_change;
  
  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Current: %, Required: %', 
      v_wallet.balance, ABS(v_amount_change);
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (
    tenant_id, wallet_id, guest_id, transaction_type, amount,
    balance_before, balance_after, description, reference_type,
    reference_id, payment_method, payment_method_id, processed_by, metadata
  ) VALUES (
    v_wallet.tenant_id, p_wallet_id, v_wallet.guest_id, p_transaction_type,
    v_amount_change, v_wallet.balance, v_new_balance, p_description,
    p_reference_type, p_reference_id, p_payment_method, p_payment_method_id,
    auth.uid(), p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Update wallet balance
  UPDATE public.guest_wallets
  SET balance = v_new_balance,
      updated_at = now()
  WHERE id = p_wallet_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_wallets_tenant_guest 
  ON public.guest_wallets(tenant_id, guest_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet 
  ON public.wallet_transactions(wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_guest 
  ON public.wallet_transactions(guest_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference 
  ON public.wallet_transactions(reference_type, reference_id);

-- Step 8: Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_guest_wallets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_guest_wallets_updated_at
  BEFORE UPDATE ON public.guest_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_guest_wallets_updated_at();

-- Step 9: Add comments for documentation
COMMENT ON TABLE public.guest_wallets IS 
'Prepaid wallet balances for guests. Guests can deposit money and use it for payments.';

COMMENT ON TABLE public.wallet_transactions IS 
'All wallet transactions (deposits, payments, refunds). Maintains complete audit trail.';

COMMENT ON FUNCTION public.process_wallet_transaction IS 
'Safely process a wallet transaction with balance validation and audit trail. Returns transaction_id.';