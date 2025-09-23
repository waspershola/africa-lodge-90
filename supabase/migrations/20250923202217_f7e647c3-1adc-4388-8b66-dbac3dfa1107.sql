-- Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_slug ON qr_codes (tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_room ON qr_codes (tenant_id, room_id);
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_qr_status ON qr_orders (tenant_id, qr_code_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_qr_orders_created_at ON qr_orders (created_at DESC);

-- Add unique constraint to prevent duplicate QRs per room
ALTER TABLE qr_codes 
ADD CONSTRAINT unique_active_room_per_tenant 
UNIQUE (tenant_id, room_id, is_active) 
DEFERRABLE INITIALLY DEFERRED;