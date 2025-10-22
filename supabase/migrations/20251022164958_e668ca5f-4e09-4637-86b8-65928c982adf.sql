-- Fix QR Codes Unique Constraint to Allow Multiple Location QR Codes
-- Issue: unique_active_room_per_tenant constraint fails for location QR codes (room_id = NULL)
-- Solution: Use partial unique index that only applies to room-based QR codes

-- Drop the problematic unique constraint
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS unique_active_room_per_tenant;

-- Create a partial unique index that only applies to room-based QR codes
-- This allows multiple location QR codes (room_id = NULL) while preventing duplicate room QRs
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_room_per_tenant 
  ON qr_codes (tenant_id, room_id, is_active)
  WHERE room_id IS NOT NULL AND is_active = true;

COMMENT ON INDEX unique_active_room_per_tenant IS 
  'Ensures only one active QR code per room, but allows multiple location QR codes (room_id = NULL)';

-- Ensure location QR codes have unique slugs for identification
-- This prevents duplicate location QRs with same slug
CREATE UNIQUE INDEX IF NOT EXISTS unique_location_qr_slug
  ON qr_codes (tenant_id, slug, is_active)
  WHERE room_id IS NULL AND is_active = true;

COMMENT ON INDEX unique_location_qr_slug IS 
  'Ensures unique slugs for location-based QR codes (e.g., poolside-bar, gym)';