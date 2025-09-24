-- Phase A: Critical Database Constraints and Indexes for Production Readiness (Fixed)

-- 1. Add unique constraints for data integrity
ALTER TABLE rooms ADD CONSTRAINT unique_room_number_per_tenant 
  UNIQUE (tenant_id, room_number);

-- 2. Add critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_dates 
  ON reservations (tenant_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_reservations_status_tenant 
  ON reservations (tenant_id, status, check_in_date);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_created 
  ON payments (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_folios_tenant_status 
  ON folios (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_rooms_tenant_status 
  ON rooms (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_tenant_status 
  ON housekeeping_tasks (tenant_id, status, assigned_to);

CREATE INDEX IF NOT EXISTS idx_guests_tenant_email 
  ON guests (tenant_id, email);

-- 3. Enable trigram extension for search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. Add search indexes
CREATE INDEX IF NOT EXISTS idx_guests_search 
  ON guests USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_reservations_guest_search 
  ON reservations USING gin (guest_name gin_trgm_ops);