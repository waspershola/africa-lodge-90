-- Phase A Critical Indexes and Constraints Only

-- Critical Performance Indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_dates ON public.reservations(tenant_id, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_status ON public.reservations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_created ON public.payments(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_status ON public.rooms(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_tenant_status ON public.housekeeping_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_status ON public.qr_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_folio_charges_tenant_folio ON public.folio_charges(tenant_id, folio_id);

-- Add unique constraints only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_tenant_room_number') THEN
        ALTER TABLE public.rooms ADD CONSTRAINT unique_tenant_room_number UNIQUE(tenant_id, room_number);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_tenant_qr_slug') THEN
        ALTER TABLE public.qr_codes ADD CONSTRAINT unique_tenant_qr_slug UNIQUE(tenant_id, slug);
    END IF;
END $$;

-- Insert sample data for immediate functionality
INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy) 
SELECT 
  t.tenant_id,
  'Standard Room',
  'Comfortable standard accommodation',
  150.00,
  2
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.room_types rt WHERE rt.tenant_id = t.tenant_id
)
LIMIT 5;

INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy)
SELECT 
  t.tenant_id,
  'Deluxe Room', 
  'Spacious deluxe accommodation',
  200.00,
  3
FROM public.tenants t  
WHERE NOT EXISTS (
  SELECT 1 FROM public.room_types rt WHERE rt.tenant_id = t.tenant_id AND rt.name = 'Deluxe Room'
)
LIMIT 5;

-- Insert sample rooms
INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status)
SELECT 
  rt.tenant_id,
  '10' || (row_number() OVER (PARTITION BY rt.tenant_id ORDER BY rt.id))::text,
  rt.id,
  1,
  'available'
FROM public.room_types rt
WHERE NOT EXISTS (
  SELECT 1 FROM public.rooms r WHERE r.tenant_id = rt.tenant_id
)
LIMIT 20;