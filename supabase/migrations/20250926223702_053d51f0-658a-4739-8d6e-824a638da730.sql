-- Create a secure function to access folio balances instead of exposing the materialized view
-- This function enforces proper access control while still providing the performance benefits
CREATE OR REPLACE FUNCTION public.get_folio_balances_secure(p_tenant_id uuid, p_status text DEFAULT 'all'::text)
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
AS $function$
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
    fb.folio_id,
    fb.folio_number,
    fb.reservation_id,
    fb.guest_name,
    fb.room_number,
    fb.total_charges,
    fb.total_payments,
    fb.balance,
    fb.folio_status,
    fb.reservation_status,
    fb.balance_status,
    fb.days_old,
    fb.created_at,
    fb.updated_at
  FROM public.folio_balances fb
  WHERE fb.tenant_id = p_tenant_id
    AND (p_status = 'all' OR fb.folio_status = p_status)
  ORDER BY fb.created_at DESC;
END;
$function$;

-- Remove the materialized view from the API schema to prevent direct access
-- This addresses the security concern while keeping the performance benefits
REVOKE ALL ON public.folio_balances FROM anon, authenticated;
REVOKE ALL ON public.folio_balances FROM public;