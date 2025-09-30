-- Phase 3: Upgrade get_folio_balances RPC to support optional folio filtering
-- Drop existing function
DROP FUNCTION IF EXISTS public.get_folio_balances_secure(uuid, text);
DROP FUNCTION IF EXISTS public.get_folio_balances(uuid, text);

-- Create updated function with optional folio_id parameter
CREATE OR REPLACE FUNCTION public.get_folio_balances(
  p_tenant_id uuid,
  p_status text DEFAULT 'all'::text,
  p_folio_id uuid DEFAULT NULL
)
RETURNS TABLE(
  folio_id uuid,
  folio_number text,
  reservation_id uuid,
  guest_name text,
  room_number text,
  total_charges numeric,
  total_payments numeric,
  balance numeric,
  folio_status text,
  reservation_status text,
  balance_status text,
  days_old numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
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
  
  -- Additional role-based access control
  IF NOT (get_user_role() = ANY (ARRAY['OWNER'::text, 'MANAGER'::text, 'FRONT_DESK'::text])) AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Insufficient privileges to view folio balances';
  END IF;
  
  RETURN QUERY
  SELECT 
    f.id as folio_id,
    f.folio_number,
    f.reservation_id,
    r.guest_name,
    rm.room_number,
    f.total_charges,
    f.total_payments,
    f.balance,
    f.status as folio_status,
    r.status as reservation_status,
    CASE 
      WHEN f.balance <= 0 THEN 'paid'::text
      WHEN f.balance > 0 AND f.balance < f.total_charges THEN 'partial'::text
      ELSE 'outstanding'::text
    END as balance_status,
    EXTRACT(DAY FROM (now() - f.created_at)) as days_old,
    f.created_at,
    f.updated_at
  FROM folios f
  JOIN reservations r ON r.id = f.reservation_id
  JOIN rooms rm ON rm.id = r.room_id
  WHERE f.tenant_id = p_tenant_id
    AND (p_status = 'all' OR f.status = p_status)
    AND (p_folio_id IS NULL OR f.id = p_folio_id)
  ORDER BY f.created_at DESC;
END;
$$;