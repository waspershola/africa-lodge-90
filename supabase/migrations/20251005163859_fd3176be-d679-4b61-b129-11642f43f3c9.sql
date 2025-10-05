-- Phase 2: Enforce Correct Payment Logic
-- Add payment_status column and constraints

-- Step 1: Add payment_status column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.payments 
    ADD COLUMN payment_status TEXT;
  END IF;
END $$;

-- Step 2: Backfill payment_status based on payment method type
-- Cash/POS/Digital/Transfer → 'paid'
-- Credit → 'unpaid'
UPDATE public.payments p
SET payment_status = CASE
  WHEN pm.type IN ('cash', 'pos', 'digital', 'transfer') THEN 'paid'
  WHEN pm.type = 'credit' THEN 'unpaid'
  ELSE 'paid'
END
FROM public.payment_methods pm
WHERE p.payment_method_id = pm.id
  AND p.payment_status IS NULL;

-- Fallback: If no payment_method_id, default to 'paid'
UPDATE public.payments
SET payment_status = 'paid'
WHERE payment_status IS NULL;

-- Step 3: Add check constraint for valid payment_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_payment_status_check'
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT payments_payment_status_check 
    CHECK (payment_status IN ('paid', 'unpaid', 'pending'));
  END IF;
END $$;

-- Step 4: Add constraint to prevent credit/pay later from being marked as paid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_credit_must_be_unpaid'
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT payment_credit_must_be_unpaid
    CHECK (
      NOT (
        payment_method IN ('Credit', 'Invoice', 'Pay Later') 
        AND payment_status = 'paid'
      )
    );
  END IF;
END $$;

-- Step 5: Create index for payment_status queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_status 
ON public.payments(payment_status, tenant_id);

-- Step 6: Add comment to document the column
COMMENT ON COLUMN public.payments.payment_status IS 
'Payment status: paid (cash/pos/digital/transfer immediate), unpaid (credit/pay later), pending (rare cases). Credit methods can NEVER be paid.';