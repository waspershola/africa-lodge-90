-- Add performance indexes for QR system
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_slug ON qr_codes (tenant_id, qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_room ON qr_codes (tenant_id, room_id) WHERE room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_qr_status ON qr_orders (tenant_id, qr_code_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_status_created ON qr_orders (tenant_id, status, created_at);