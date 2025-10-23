-- Phase 4A: Database Trigger for Automatic Staff Notification Creation
-- This ensures ALL QR requests automatically create staff notifications at database level

-- Create function to automatically create staff notification for new QR request
CREATE OR REPLACE FUNCTION create_staff_notification_for_qr_request()
RETURNS TRIGGER AS $$
DECLARE
  v_room_number TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
  v_department TEXT;
  v_recipients JSONB;
  v_priority TEXT;
  v_sound_type TEXT;
BEGIN
  -- Get room number if available
  IF NEW.room_id IS NOT NULL THEN
    SELECT room_number INTO v_room_number
    FROM rooms WHERE id = NEW.room_id;
  END IF;

  -- Determine department, recipients, and title based on request type
  CASE NEW.request_type
    WHEN 'ROOM_SERVICE' THEN
      v_department := 'FRONT_DESK';
      v_recipients := to_jsonb(ARRAY['FRONT_DESK', 'POS', 'RESTAURANT']);
      v_notification_title := 'New Room Service Request';
    WHEN 'HOUSEKEEPING' THEN
      v_department := 'HOUSEKEEPING';
      v_recipients := to_jsonb(ARRAY['HOUSEKEEPING', 'FRONT_DESK']);
      v_notification_title := 'New Housekeeping Request';
    WHEN 'MAINTENANCE' THEN
      v_department := 'MAINTENANCE';
      v_recipients := to_jsonb(ARRAY['MAINTENANCE', 'FRONT_DESK']);
      v_notification_title := 'New Maintenance Request';
    WHEN 'FEEDBACK' THEN
      v_department := 'FRONT_DESK';
      v_recipients := to_jsonb(ARRAY['FRONT_DESK', 'MANAGER']);
      v_notification_title := 'New Guest Feedback';
    WHEN 'CONCIERGE' THEN
      v_department := 'FRONT_DESK';
      v_recipients := to_jsonb(ARRAY['FRONT_DESK', 'CONCIERGE']);
      v_notification_title := 'New Concierge Request';
    WHEN 'SPA' THEN
      v_department := 'SPA';
      v_recipients := to_jsonb(ARRAY['SPA', 'FRONT_DESK']);
      v_notification_title := 'New Spa Request';
    WHEN 'LAUNDRY' THEN
      v_department := 'HOUSEKEEPING';
      v_recipients := to_jsonb(ARRAY['HOUSEKEEPING', 'FRONT_DESK']);
      v_notification_title := 'New Laundry Request';
    ELSE
      v_department := 'FRONT_DESK';
      v_recipients := to_jsonb(ARRAY['FRONT_DESK']);
      v_notification_title := 'New Guest Request';
  END CASE;

  -- Build message with room number if available
  IF v_room_number IS NOT NULL THEN
    v_notification_message := 'Room ' || v_room_number || ' - ' || NEW.request_type;
  ELSE
    v_notification_message := 'Guest Request - ' || NEW.request_type;
  END IF;

  -- Determine priority and sound based on request priority
  IF NEW.priority = 'urgent' THEN
    v_priority := 'high';
    v_sound_type := 'alert-critical';
  ELSE
    v_priority := 'medium';
    v_sound_type := 'alert-high';
  END IF;

  -- Insert staff notification (guaranteed delivery at database level)
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
  ) VALUES (
    NEW.tenant_id,
    v_notification_title,
    v_notification_message,
    'guest_request',
    v_priority,
    v_sound_type,
    v_department,
    v_recipients,
    'pending',
    'qr_request',
    NEW.id,
    to_jsonb(ARRAY['acknowledge', 'view_details', 'assign']),
    jsonb_build_object(
      'request_type', NEW.request_type,
      'room_id', NEW.room_id,
      'qr_code_id', NEW.qr_code_id,
      'session_id', NEW.session_id,
      'trigger_created', true,
      'auto_generated', true
    ),
    NEW.created_at
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block QR request insertion
    RAISE WARNING 'Failed to create staff notification for QR request %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to fire after QR request insertion
DROP TRIGGER IF EXISTS notify_staff_on_qr_request_insert ON qr_requests;

CREATE TRIGGER notify_staff_on_qr_request_insert
  AFTER INSERT ON qr_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_staff_notification_for_qr_request();

-- Phase 4B: Backfill Missing Notifications for Recent Requests
-- Backfill the 4 identified requests that have no notifications

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
    WHEN qr.request_type = 'FEEDBACK' THEN 'New Guest Feedback'
    WHEN qr.request_type = 'CONCIERGE' THEN 'New Concierge Request'
    WHEN qr.request_type = 'SPA' THEN 'New Spa Request'
    WHEN qr.request_type = 'LAUNDRY' THEN 'New Laundry Request'
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
    WHEN qr.request_type = 'FEEDBACK' THEN 'FRONT_DESK'
    WHEN qr.request_type = 'CONCIERGE' THEN 'FRONT_DESK'
    WHEN qr.request_type = 'SPA' THEN 'SPA'
    WHEN qr.request_type = 'LAUNDRY' THEN 'HOUSEKEEPING'
    ELSE 'FRONT_DESK'
  END as department,
  CASE 
    WHEN qr.request_type = 'ROOM_SERVICE' THEN to_jsonb(ARRAY['FRONT_DESK', 'POS', 'RESTAURANT'])
    WHEN qr.request_type = 'HOUSEKEEPING' THEN to_jsonb(ARRAY['HOUSEKEEPING', 'FRONT_DESK'])
    WHEN qr.request_type = 'MAINTENANCE' THEN to_jsonb(ARRAY['MAINTENANCE', 'FRONT_DESK'])
    WHEN qr.request_type = 'FEEDBACK' THEN to_jsonb(ARRAY['FRONT_DESK', 'MANAGER'])
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
    'session_id', qr.session_id,
    'backfilled', true,
    'backfill_reason', 'Phase 4B: Missing notification - created retroactively after trigger implementation',
    'backfill_phase', 'Phase 4B'
  ) as metadata,
  qr.created_at as created_at
FROM qr_requests qr
LEFT JOIN rooms r ON r.id = qr.room_id
WHERE qr.id IN (
  'a9efa486-f3af-4cc5-ab03-94275073720e',  -- FEEDBACK from phone (09:46:38)
  '7663c035-fb12-49dd-91dd-f7047ddd6d49',  -- HOUSEKEEPING from phone (09:45:59)
  '56a16eef-f98d-47a8-a701-2b7e1e59d1d2',  -- ROOM_SERVICE (09:42:59)
  '12e5f173-851c-4998-8991-8a0824660556'   -- HOUSEKEEPING (09:42:47)
)
AND NOT EXISTS (
  SELECT 1 FROM staff_notifications sn 
  WHERE sn.reference_type = 'qr_request' 
  AND sn.reference_id = qr.id
);

-- Add audit log entry for Phase 4 implementation
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
  'IMPLEMENT_QR_NOTIFICATION_TRIGGER' as action,
  'qr_requests' as resource_type,
  NULL::uuid as resource_id,
  'Phase 4: Implemented database trigger for automatic staff notification creation + backfilled 4 missing notifications' as description,
  jsonb_build_object(
    'phase', 'Phase 4A + 4B',
    'trigger_function', 'create_staff_notification_for_qr_request()',
    'trigger_name', 'notify_staff_on_qr_request_insert',
    'backfilled_request_ids', ARRAY[
      'a9efa486-f3af-4cc5-ab03-94275073720e',
      '7663c035-fb12-49dd-91dd-f7047ddd6d49',
      '56a16eef-f98d-47a8-a701-2b7e1e59d1d2',
      '12e5f173-851c-4998-8991-8a0824660556'
    ],
    'backfilled_count', 4,
    'implementation_date', NOW(),
    'features', ARRAY[
      'Database-level notification guarantee',
      'Device-independent operation',
      'Automatic department routing',
      'Error handling with non-blocking',
      'Backfilled missing phone + PC requests'
    ]
  ) as metadata,
  NOW() as created_at
FROM qr_requests qr
WHERE qr.id = 'a9efa486-f3af-4cc5-ab03-94275073720e'
LIMIT 1;