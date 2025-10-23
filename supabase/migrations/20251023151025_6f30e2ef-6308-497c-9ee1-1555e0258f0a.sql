-- Phase 1: Database & Schema Updates for Guest Messaging Redesign (Fixed NULL handling)

-- 1. Rename qr_order_id to qr_request_id in guest_messages for clarity
ALTER TABLE guest_messages 
  RENAME COLUMN qr_order_id TO qr_request_id;

-- 2. Add message attachment support
ALTER TABLE guest_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- 3. Create message_templates table for quick replies
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  template_text TEXT NOT NULL,
  request_types TEXT[] DEFAULT ARRAY['all'],
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, template_key)
);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view templates in own tenant"
  ON message_templates FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Managers can manage templates"
  ON message_templates FOR ALL
  USING (
    tenant_id = get_user_tenant_id() 
    AND get_user_role() IN ('OWNER', 'MANAGER')
  );

-- 4. Insert default quick reply templates
INSERT INTO message_templates (tenant_id, template_key, template_text, request_types, category, sort_order)
SELECT 
  t.tenant_id,
  templates.template_key,
  templates.template_text,
  templates.request_types,
  templates.category,
  templates.sort_order
FROM tenants t
CROSS JOIN (
  VALUES 
    ('quick_acknowledge', 'Thank you for your request. We''ll handle that right away.', ARRAY['HOUSEKEEPING', 'MAINTENANCE', 'ROOM_SERVICE'], 'acknowledgment', 1),
    ('housekeeping_dispatched', 'Our housekeeping team has been dispatched to your room.', ARRAY['HOUSEKEEPING'], 'housekeeping', 2),
    ('housekeeping_completed', 'Housekeeping service completed. Please let us know if you need anything else.', ARRAY['HOUSEKEEPING'], 'housekeeping', 3),
    ('room_service_preparing', 'Your order is being prepared in the kitchen.', ARRAY['ROOM_SERVICE', 'DIGITAL_MENU'], 'room_service', 4),
    ('room_service_enroute', 'Your order is on the way to your room.', ARRAY['ROOM_SERVICE', 'DIGITAL_MENU'], 'room_service', 5),
    ('room_service_delivered', 'Your order has been delivered. Enjoy your meal!', ARRAY['ROOM_SERVICE', 'DIGITAL_MENU'], 'room_service', 6),
    ('maintenance_assigned', 'A maintenance technician has been assigned to your request.', ARRAY['MAINTENANCE'], 'maintenance', 7),
    ('maintenance_inprogress', 'Our technician is currently working on the issue.', ARRAY['MAINTENANCE'], 'maintenance', 8),
    ('maintenance_completed', 'The maintenance issue has been resolved. Thank you for your patience.', ARRAY['MAINTENANCE'], 'maintenance', 9),
    ('feedback_thankyou', 'Thank you for your feedback! We truly appreciate your input.', ARRAY['FEEDBACK'], 'feedback', 10),
    ('general_delay', 'We apologize for the delay. We''re working on your request and will update you shortly.', ARRAY['all'], 'general', 11),
    ('general_question', 'Is there anything else we can help you with?', ARRAY['all'], 'general', 12)
) AS templates(template_key, template_text, request_types, category, sort_order)
ON CONFLICT (tenant_id, template_key) DO NOTHING;

-- 5. Create database function to format request messages (with NULL handling)
CREATE OR REPLACE FUNCTION format_request_message(
  request_type TEXT,
  request_data JSONB,
  room_number TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  formatted_message TEXT;
  service_labels TEXT[];
  items JSONB;
  total_amount NUMERIC;
  item_count INTEGER;
BEGIN
  CASE request_type
    WHEN 'HOUSEKEEPING' THEN
      formatted_message := '🧹 Housekeeping Request';
      IF room_number IS NOT NULL THEN
        formatted_message := formatted_message || ' — Room ' || room_number;
      END IF;
      
      IF request_data->'service_labels' IS NOT NULL THEN
        service_labels := ARRAY(SELECT jsonb_array_elements_text(request_data->'service_labels'));
        formatted_message := formatted_message || E'\n\nRequested Services:\n• ' || array_to_string(service_labels, E'\n• ');
      END IF;
      
      IF request_data->>'special_requests' IS NOT NULL AND request_data->>'special_requests' != '' THEN
        formatted_message := formatted_message || E'\n\nSpecial Requests:\n' || (request_data->>'special_requests');
      END IF;

    WHEN 'ROOM_SERVICE', 'DIGITAL_MENU' THEN
      formatted_message := '🥘 Room Service Order';
      IF room_number IS NOT NULL THEN
        formatted_message := formatted_message || ' — Room ' || room_number;
      END IF;
      
      items := request_data->'items';
      IF items IS NOT NULL AND jsonb_typeof(items) = 'array' THEN
        item_count := jsonb_array_length(items);
        IF item_count > 0 THEN
          formatted_message := formatted_message || E'\n\nOrdered Items:\n';
          FOR i IN 0..(item_count - 1) LOOP
            formatted_message := formatted_message || '• ' || 
              (items->i->>'quantity')::TEXT || 'x ' || 
              (items->i->>'name') || 
              ' (₦' || (items->i->>'price')::TEXT || ')' || E'\n';
          END LOOP;
        END IF;
      END IF;
      
      IF request_data->>'total_amount' IS NOT NULL THEN
        total_amount := (request_data->>'total_amount')::NUMERIC;
        formatted_message := formatted_message || E'\nTotal: ₦' || total_amount::TEXT;
      END IF;
      
      IF request_data->>'special_instructions' IS NOT NULL AND request_data->>'special_instructions' != '' THEN
        formatted_message := formatted_message || E'\n\nSpecial Instructions:\n' || (request_data->>'special_instructions');
      END IF;

    WHEN 'MAINTENANCE' THEN
      formatted_message := '🔧 Maintenance Request';
      IF room_number IS NOT NULL THEN
        formatted_message := formatted_message || ' — Room ' || room_number;
      END IF;
      formatted_message := formatted_message || E'\n\nIssue: ' || COALESCE(request_data->>'issue_type', 'Not specified');
      IF request_data->>'priority' IS NOT NULL THEN
        formatted_message := formatted_message || E'\nPriority: ' || (request_data->>'priority');
      END IF;
      IF request_data->>'description' IS NOT NULL AND request_data->>'description' != '' THEN
        formatted_message := formatted_message || E'\n\nDescription:\n' || (request_data->>'description');
      END IF;

    WHEN 'FEEDBACK' THEN
      formatted_message := '⭐ Guest Feedback';
      IF room_number IS NOT NULL THEN
        formatted_message := formatted_message || ' — Room ' || room_number;
      END IF;
      IF request_data->>'rating' IS NOT NULL THEN
        formatted_message := formatted_message || E'\nRating: ' || (request_data->>'rating') || '/5';
      END IF;
      IF request_data->>'category' IS NOT NULL THEN
        formatted_message := formatted_message || E'\nCategory: ' || (request_data->>'category');
      END IF;
      IF request_data->>'comment' IS NOT NULL AND request_data->>'comment' != '' THEN
        formatted_message := formatted_message || E'\n\nComment:\n' || (request_data->>'comment');
      END IF;

    WHEN 'WIFI_ACCESS' THEN
      formatted_message := '📶 WiFi Access Request';
      IF room_number IS NOT NULL THEN
        formatted_message := formatted_message || ' — Room ' || room_number;
      END IF;
      formatted_message := formatted_message || E'\n\nGuest requested WiFi credentials.';

    ELSE
      formatted_message := '📝 Service Request';
      IF room_number IS NOT NULL THEN
        formatted_message := formatted_message || ' — Room ' || room_number;
      END IF;
      formatted_message := formatted_message || E'\n\nRequest Type: ' || request_type;
  END CASE;

  RETURN formatted_message;
END;
$$;

-- 6. Add formatted_summary column to qr_requests
ALTER TABLE qr_requests
  ADD COLUMN IF NOT EXISTS formatted_summary TEXT;

-- 7. Create trigger to auto-generate formatted_summary
CREATE OR REPLACE FUNCTION update_qr_request_formatted_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.formatted_summary := format_request_message(
    NEW.request_type,
    NEW.request_data,
    (SELECT room_number FROM rooms WHERE id = NEW.room_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_qr_request_formatted_summary
  BEFORE INSERT OR UPDATE OF request_type, request_data, room_id
  ON qr_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_request_formatted_summary();

-- 8. Backfill formatted_summary for existing requests
UPDATE qr_requests
SET formatted_summary = format_request_message(
  request_type,
  request_data,
  (SELECT room_number FROM rooms WHERE id = qr_requests.room_id)
)
WHERE formatted_summary IS NULL;

-- 9. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guest_messages_qr_request_id ON guest_messages(qr_request_id);
CREATE INDEX IF NOT EXISTS idx_guest_messages_created_at ON guest_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_messages_sender_type ON guest_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_tenant_request_types ON message_templates(tenant_id, request_types);

-- 10. Update realtime publication to include message_templates
ALTER PUBLICATION supabase_realtime ADD TABLE message_templates;