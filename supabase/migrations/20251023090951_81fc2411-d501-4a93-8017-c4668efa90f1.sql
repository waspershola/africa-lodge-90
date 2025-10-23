-- Phase 3: Backfill Missing Staff Notifications for Recent QR Requests
-- This creates notifications for 4 recent test requests that were created without notifications

-- Insert missing staff notifications for recent requests
INSERT INTO staff_notifications (
  tenant_id,
  title,
  message,
  notification_type,
  priority,
  sound_type,
  department,
  recipients,
  status,
  reference_type,
  reference_id,
  actions,
  metadata,
  created_at
)
SELECT 
  qr.tenant_id,
  CASE 
    WHEN qr.request_type = 'ROOM_SERVICE' THEN 'New Room Service Request'
    WHEN qr.request_type = 'HOUSEKEEPING' THEN 'New Housekeeping Request'
    WHEN qr.request_type = 'MAINTENANCE' THEN 'New Maintenance Request'
    ELSE 'New Guest Request'
  END as title,
  CASE 
    WHEN r.room_number IS NOT NULL THEN 'Room ' || r.room_number || ' - ' || qr.request_type
    ELSE 'Guest Request - ' || qr.request_type
  END as message,
  'guest_request' as notification_type,
  CASE 
    WHEN qr.priority = 'urgent' THEN 'high'
    ELSE 'medium'
  END as priority,
  CASE 
    WHEN qr.priority = 'urgent' THEN 'alert-critical'
    ELSE 'alert-high'
  END as sound_type,
  CASE 
    WHEN qr.request_type = 'ROOM_SERVICE' THEN 'FRONT_DESK'
    WHEN qr.request_type = 'HOUSEKEEPING' THEN 'HOUSEKEEPING'
    WHEN qr.request_type = 'MAINTENANCE' THEN 'MAINTENANCE'
    WHEN qr.request_type = 'CONCIERGE' THEN 'FRONT_DESK'
    WHEN qr.request_type = 'SPA' THEN 'SPA'
    WHEN qr.request_type = 'LAUNDRY' THEN 'HOUSEKEEPING'
    ELSE 'FRONT_DESK'
  END as department,
  CASE 
    WHEN qr.request_type = 'ROOM_SERVICE' THEN to_jsonb(ARRAY['FRONT_DESK', 'POS', 'RESTAURANT'])
    WHEN qr.request_type = 'HOUSEKEEPING' THEN to_jsonb(ARRAY['HOUSEKEEPING', 'FRONT_DESK'])
    WHEN qr.request_type = 'MAINTENANCE' THEN to_jsonb(ARRAY['MAINTENANCE', 'FRONT_DESK'])
    WHEN qr.request_type = 'CONCIERGE' THEN to_jsonb(ARRAY['FRONT_DESK', 'CONCIERGE'])
    WHEN qr.request_type = 'SPA' THEN to_jsonb(ARRAY['SPA', 'FRONT_DESK'])
    WHEN qr.request_type = 'LAUNDRY' THEN to_jsonb(ARRAY['HOUSEKEEPING', 'FRONT_DESK'])
    ELSE to_jsonb(ARRAY['FRONT_DESK'])
  END as recipients,
  'pending' as status,
  'qr_request' as reference_type,
  qr.id as reference_id,
  to_jsonb(ARRAY['acknowledge', 'view_details', 'assign']) as actions,
  jsonb_build_object(
    'request_type', qr.request_type,
    'room_id', qr.room_id,
    'qr_code_id', qr.qr_code_id,
    'backfilled', true,
    'backfill_reason', 'Missing notification - created retroactively'
  ) as metadata,
  qr.created_at as created_at
FROM qr_requests qr
LEFT JOIN rooms r ON r.id = qr.room_id
WHERE qr.id IN (
  'ae7fec1a-c1b0-498d-9c57-6cfb8b49ee88',
  '812eb926-3d7a-44f5-be40-4e2e76b0feaa',
  '16142705-6e1c-4972-ad5d-b3e5dfa5c0c2',
  'af65c1d1-e7bf-4a4c-a6dd-fb8e6e0fdf82'
)
AND NOT EXISTS (
  SELECT 1 FROM staff_notifications sn 
  WHERE sn.reference_type = 'qr_request' 
  AND sn.reference_id = qr.id
);

-- Add audit log entry for backfill operation
INSERT INTO audit_log (
  tenant_id,
  action,
  resource_type,
  resource_id,
  description,
  metadata,
  created_at
)
SELECT DISTINCT
  qr.tenant_id,
  'BACKFILL_NOTIFICATIONS' as action,
  'staff_notifications' as resource_type,
  NULL::uuid as resource_id,
  'Backfill missing notifications for QR requests' as description,
  jsonb_build_object(
    'reason', 'Backfill missing notifications for QR requests',
    'request_ids', ARRAY['ae7fec1a-c1b0-498d-9c57-6cfb8b49ee88', '812eb926-3d7a-44f5-be40-4e2e76b0feaa', '16142705-6e1c-4972-ad5d-b3e5dfa5c0c2', 'af65c1d1-e7bf-4a4c-a6dd-fb8e6e0fdf82'],
    'backfill_date', NOW(),
    'migration', 'Phase 3: QR Request Notification Backfill'
  ) as metadata,
  NOW() as created_at
FROM qr_requests qr
WHERE qr.id IN (
  'ae7fec1a-c1b0-498d-9c57-6cfb8b49ee88',
  '812eb926-3d7a-44f5-be40-4e2e76b0feaa',
  '16142705-6e1c-4972-ad5d-b3e5dfa5c0c2',
  'af65c1d1-e7bf-4a4c-a6dd-fb8e6e0fdf82'
)
LIMIT 1;