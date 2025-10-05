-- Phase 2: Enforce Correct Payment Logic (Fixed Migration)
-- Add payment_status column and enforce credit payment rules

-- Step 1: Add payment_status column to payments table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE payments 
    ADD COLUMN payment_status TEXT DEFAULT 'paid';
  END IF;
END $$;

-- Step 2: Backfill payment_status based on existing status column
UPDATE payments 
SET payment_status = CASE 
  WHEN status = 'completed' THEN 'paid'
  WHEN status = 'pending' THEN 'pending'
  WHEN status = 'failed' THEN 'unpaid'
  ELSE 'paid'
END
WHERE payment_status IS NULL OR payment_status = 'paid';

-- Step 3: FIX EXISTING CREDIT PAYMENTS - Mark all credit payments as unpaid
-- This is the critical fix: credit payments should NEVER be marked as paid
UPDATE payments 
SET payment_status = 'unpaid'
WHERE (
  payment_method ILIKE '%credit%' OR 
  payment_method ILIKE '%invoice%' OR 
  payment_method ILIKE '%pay_later%' OR
  payment_method = 'credit'
);

-- Step 4: Add check constraint for payment_status values
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_status_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_payment_status_check 
CHECK (payment_status IN ('paid', 'unpaid', 'pending'));

-- Step 5: Add constraint to prevent credit/pay later from being marked as paid
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payment_credit_must_be_unpaid;

ALTER TABLE payments 
ADD CONSTRAINT payment_credit_must_be_unpaid 
CHECK (
  -- If payment method contains 'credit' or 'invoice' or 'pay_later', 
  -- payment_status must be 'unpaid' or 'pending'
  NOT (
    (payment_method ILIKE '%credit%' OR 
     payment_method ILIKE '%invoice%' OR 
     payment_method ILIKE '%pay_later%' OR
     payment_method = 'credit')
    AND payment_status = 'paid'
  )
);

-- Step 6: Add index for payment_status queries
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status) 
WHERE payment_status IN ('unpaid', 'pending');

-- Step 7: Add comment for documentation
COMMENT ON COLUMN payments.payment_status IS 
'Payment status: paid (completed), unpaid (credit/debt awaiting payment), pending (awaiting verification). Credit payments must remain unpaid until actual payment received.';

COMMENT ON CONSTRAINT payment_credit_must_be_unpaid ON payments IS 
'Enforces that credit/pay later payments cannot be marked as paid - they must remain unpaid until real payment is received';