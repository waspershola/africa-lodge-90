-- Phase 1: Critical Performance Indexes and Views
-- Add indexes for dashboard queries on key tables

-- Reservations table indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_status ON reservations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_dates ON reservations(tenant_id, check_in_date, check_out_date);

-- Payments table indexes for billing dashboard
CREATE INDEX IF NOT EXISTS idx_payments_tenant_created ON payments(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_folio_id ON payments(folio_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Folio charges indexes for billing calculations  
CREATE INDEX IF NOT EXISTS idx_folio_charges_tenant ON folio_charges(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_folio_charges_folio_id ON folio_charges(folio_id);

-- Rooms indexes for occupancy calculations
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_status ON rooms(tenant_id, status);

-- Work orders indexes for maintenance dashboard
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status ON work_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority, status);

-- Housekeeping tasks indexes
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_tenant_status ON housekeeping_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_assigned ON housekeeping_tasks(assigned_to, status);

-- QR orders indexes for notification system  
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_status ON qr_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_qr_orders_created ON qr_orders(created_at);

-- Create folio_balances materialized view for billing dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS folio_balances AS
SELECT 
  f.id as folio_id,
  f.tenant_id,
  f.reservation_id,
  f.folio_number,
  f.status,
  COALESCE(charges.total_charges, 0) as total_charges,
  COALESCE(payments.total_payments, 0) as total_payments,
  (COALESCE(charges.total_charges, 0) - COALESCE(payments.total_payments, 0)) as balance,
  f.created_at,
  f.updated_at
FROM folios f
LEFT JOIN (
  SELECT 
    folio_id, 
    SUM(amount) as total_charges
  FROM folio_charges 
  GROUP BY folio_id
) charges ON f.id = charges.folio_id
LEFT JOIN (
  SELECT 
    folio_id, 
    SUM(amount) as total_payments  
  FROM payments 
  WHERE status = 'completed'
  GROUP BY folio_id
) payments ON f.id = payments.folio_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_folio_balances_id ON folio_balances(folio_id);
CREATE INDEX IF NOT EXISTS idx_folio_balances_tenant ON folio_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_folio_balances_status ON folio_balances(status);

-- Function to refresh folio balances (call this periodically or on changes)
CREATE OR REPLACE FUNCTION refresh_folio_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY folio_balances;
END;
$$;

-- Enable realtime for key dashboard tables
ALTER TABLE reservations REPLICA IDENTITY FULL;
ALTER TABLE rooms REPLICA IDENTITY FULL;  
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE work_orders REPLICA IDENTITY FULL;
ALTER TABLE housekeeping_tasks REPLICA IDENTITY FULL;
ALTER TABLE qr_orders REPLICA IDENTITY FULL;

-- Add these tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE housekeeping_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE qr_orders;