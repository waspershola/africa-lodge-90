-- Fix payments_payment_method_check constraint to support all payment types
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['cash', 'card', 'transfer', 'pos', 'credit', 'digital', 'complimentary']));