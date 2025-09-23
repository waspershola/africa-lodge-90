-- Find and fix any remaining security definer views

-- Check if there are any regular views (not materialized) with security definer
-- Most likely candidates from the codebase are revenue_by_payment_method

-- Fix revenue_by_payment_method view if it exists with security definer
DROP VIEW IF EXISTS revenue_by_payment_method CASCADE;

-- Recreate it as a secure view with security_invoker
CREATE VIEW revenue_by_payment_method
WITH (security_invoker = true) AS
SELECT 
  p.tenant_id,
  DATE(p.created_at) as payment_date,
  p.payment_method,
  SUM(p.amount) as total_amount,
  COUNT(p.id) as transaction_count,
  AVG(p.amount) as avg_transaction_amount
FROM payments p
WHERE p.status = 'completed'
  AND p.created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY p.tenant_id, DATE(p.created_at), p.payment_method;

-- Add RLS to the view
ALTER VIEW revenue_by_payment_method ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the view
CREATE POLICY "tenant_revenue_access" ON revenue_by_payment_method
FOR SELECT USING (strict_tenant_access(tenant_id));

-- Also check if folio_balances was recreated as a view somewhere
-- Make sure it doesn't exist as a view
DROP VIEW IF EXISTS folio_balances CASCADE;

-- Double-check: Drop any other potentially problematic views
-- Check system catalog for views with security definer
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
          AND definition LIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_record.schemaname) || '.' || quote_ident(view_record.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped security definer view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END;
$$;