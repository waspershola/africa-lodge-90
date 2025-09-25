-- Insert hotel_settings record for existing tenant if it doesn't exist
INSERT INTO hotel_settings (tenant_id, email_settings)
SELECT 
  'f8a5215e-1730-48f9-869c-3c53e432433c'::uuid,
  jsonb_build_object(
    'branding', jsonb_build_object(
      'footer_text', 'Thank you for choosing us!',
      'accent_color', '#f59e0b',
      'header_color', '#2563eb'
    ),
    'from_name', 'Hotel banky hotel',
    'from_email', '',
    'smtp_config', '{}'::jsonb,
    'smtp_enabled', false,
    'reply_to_email', 'wasiu@gmail.com',
    'email_templates', jsonb_build_object(
      'invoice', jsonb_build_object('enabled', true, 'subject', 'Invoice for Your Reservation - banky hotel'),
      'reminder', jsonb_build_object('enabled', true, 'subject', 'Payment Reminder - banky hotel'),
      'confirmation', jsonb_build_object('enabled', true, 'subject', 'Reservation Confirmation - banky hotel'),
      'group_confirmation', jsonb_build_object('enabled', true, 'subject', 'Group Reservation Confirmation - banky hotel')
    ),
    'send_to_individuals', false
  )
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_settings WHERE tenant_id = 'f8a5215e-1730-48f9-869c-3c53e432433c'
);