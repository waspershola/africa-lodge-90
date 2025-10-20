-- Phase 3: Auto-Create Wallets for All Guests (Fixed)

-- Create trigger function to auto-create wallet when guest is created
CREATE OR REPLACE FUNCTION public.auto_create_guest_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create wallet for the new guest
  INSERT INTO public.guest_wallets (
    tenant_id,
    guest_id,
    balance,
    currency,
    is_active
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    0.00,
    'NGN',
    true
  )
  ON CONFLICT (tenant_id, guest_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on guests table
DROP TRIGGER IF EXISTS trigger_auto_create_guest_wallet ON public.guests;
CREATE TRIGGER trigger_auto_create_guest_wallet
  AFTER INSERT ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_guest_wallet();

-- Backfill wallets for existing guests (idempotent)
INSERT INTO public.guest_wallets (tenant_id, guest_id, balance, currency, is_active)
SELECT 
  g.tenant_id,
  g.id,
  0.00,
  'NGN',
  true
FROM public.guests g
WHERE NOT EXISTS (
  SELECT 1 FROM public.guest_wallets gw 
  WHERE gw.guest_id = g.id AND gw.tenant_id = g.tenant_id
)
ON CONFLICT (tenant_id, guest_id) DO NOTHING;