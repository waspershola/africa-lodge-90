-- Fix security definer view issue by removing problematic views

-- Drop revenue_by_payment_method view completely
DROP VIEW IF EXISTS revenue_by_payment_method CASCADE;

-- Drop any other problematic views  
DROP VIEW IF EXISTS folio_balances CASCADE;

-- Create a secure function instead of the view for revenue by payment method
CREATE OR REPLACE FUNCTION public.get_revenue_by_payment_method(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
  payment_date DATE,
  payment_method TEXT,
  total_amount NUMERIC,
  transaction_count BIGINT,
  avg_transaction_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access to own tenant data or super admin
  IF NOT (is_super_admin() OR can_access_tenant(p_tenant_id)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    DATE(p.created_at) as payment_date,
    p.payment_method,
    SUM(p.amount) as total_amount,
    COUNT(p.id) as transaction_count,
    AVG(p.amount) as avg_transaction_amount
  FROM payments p
  WHERE p.tenant_id = p_tenant_id
    AND p.status = 'completed'
    AND DATE(p.created_at) BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(p.created_at), p.payment_method
  ORDER BY DATE(p.created_at), p.payment_method;
END;
$$;