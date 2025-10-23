-- Fix Room 103: Reactivate QR code after cleanup left it inactive
UPDATE qr_codes 
SET is_active = true, expires_at = NULL, updated_at = now()
WHERE id = 'f88d9ab5-0c96-4b54-9f55-c7847cafab91';

-- Log the manual fix in audit_log
INSERT INTO audit_log (tenant_id, action, resource_type, resource_id, metadata)
SELECT 
  tenant_id,
  'qr_manual_reactivation_after_cleanup',
  'qr_code',
  id,
  jsonb_build_object(
    'reason', 'Room left without active QR after duplicate cleanup',
    'room_id', room_id,
    'manual_fix', true
  )
FROM qr_codes
WHERE id = 'f88d9ab5-0c96-4b54-9f55-c7847cafab91';