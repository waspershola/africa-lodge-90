-- Create the missing folio_balances materialized view
-- This view provides a consolidated view of folio balances across all tenants
CREATE MATERIALIZED VIEW public.folio_balances AS
SELECT 
    f.id as folio_id,
    f.tenant_id,
    f.folio_number,
    f.reservation_id,
    r.guest_name,
    rm.room_number,
    f.total_charges,
    f.total_payments,
    f.balance,
    f.status as folio_status,
    r.status as reservation_status,
    f.created_at,
    f.updated_at,
    -- Additional computed fields for analytics
    CASE 
        WHEN f.balance > 0 THEN 'outstanding'
        WHEN f.balance < 0 THEN 'credit'
        ELSE 'settled'
    END as balance_status,
    -- Days since folio creation
    EXTRACT(DAY FROM (now() - f.created_at)) as days_old
FROM public.folios f
LEFT JOIN public.reservations r ON r.id = f.reservation_id
LEFT JOIN public.rooms rm ON rm.id = r.room_id
WHERE f.tenant_id IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX idx_folio_balances_tenant_id ON public.folio_balances(tenant_id);
CREATE INDEX idx_folio_balances_balance_status ON public.folio_balances(balance_status);
CREATE INDEX idx_folio_balances_folio_status ON public.folio_balances(folio_status);

-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW public.folio_balances OWNER TO postgres;

-- Refresh the materialized view to populate it with current data
REFRESH MATERIALIZED VIEW public.folio_balances;