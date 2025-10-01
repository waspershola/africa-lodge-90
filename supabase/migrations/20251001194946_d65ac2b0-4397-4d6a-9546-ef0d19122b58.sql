-- ===================================================================
-- Phase 1: Add Performance Indexes (Existing Tables Only)
-- ===================================================================

-- Reservations: tenant + date range queries
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_dates
  ON public.reservations (tenant_id, check_in_date, check_out_date);

-- Reservations: tenant + status + date range (for complex filters)
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_status_dates
  ON public.reservations (tenant_id, status, check_in_date, check_out_date);

-- Rooms: tenant + status (for room availability)
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_status
  ON public.rooms (tenant_id, status);

-- Payments: tenant + created_at (for payment history)
CREATE INDEX IF NOT EXISTS idx_payments_tenant_created
  ON public.payments (tenant_id, created_at DESC);

-- Folios: tenant + balance (for outstanding balance reports)
CREATE INDEX IF NOT EXISTS idx_folios_tenant_balance
  ON public.folios (tenant_id, balance) WHERE balance > 0;

-- Folios: tenant + status (for open folios)
CREATE INDEX IF NOT EXISTS idx_folios_tenant_status
  ON public.folios (tenant_id, status) WHERE status = 'open';

-- Guests: tenant + email (for guest lookup)
CREATE INDEX IF NOT EXISTS idx_guests_tenant_email
  ON public.guests (tenant_id, email);

-- Housekeeping Tasks: tenant + status (for task management)
CREATE INDEX IF NOT EXISTS idx_housekeeping_tenant_status
  ON public.housekeeping_tasks (tenant_id, status);

-- Audit Log: tenant + created_at (for audit trail queries)
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_created
  ON public.audit_log (tenant_id, created_at DESC);

-- Reservation search by guest name (for quick search)
CREATE INDEX IF NOT EXISTS idx_reservations_guest_search
  ON public.reservations USING gin(to_tsvector('english', guest_name));

-- ===================================================================
-- ROLLBACK SCRIPT
-- ===================================================================
/*
DROP INDEX IF EXISTS idx_reservations_tenant_dates;
DROP INDEX IF EXISTS idx_reservations_tenant_status_dates;
DROP INDEX IF EXISTS idx_rooms_tenant_status;
DROP INDEX IF EXISTS idx_payments_tenant_created;
DROP INDEX IF EXISTS idx_folios_tenant_balance;
DROP INDEX IF EXISTS idx_folios_tenant_status;
DROP INDEX IF EXISTS idx_guests_tenant_email;
DROP INDEX IF EXISTS idx_housekeeping_tenant_status;
DROP INDEX IF EXISTS idx_audit_log_tenant_created;
DROP INDEX IF EXISTS idx_reservations_guest_search;
*/