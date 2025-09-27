-- Add SMS validation fields to sms_templates table
ALTER TABLE public.sms_templates 
ADD COLUMN IF NOT EXISTS estimated_sms_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS character_count_warning BOOLEAN DEFAULT false;

-- Update existing templates with estimates
UPDATE public.sms_templates 
SET estimated_sms_count = CASE 
  WHEN LENGTH(message_template) <= 160 THEN 1
  ELSE CEIL(LENGTH(message_template)::float / 160)
END,
character_count_warning = LENGTH(message_template) > 160;

-- Clear existing global templates to avoid duplicates
DELETE FROM public.sms_templates WHERE is_global = true;

-- Insert the 12 curated SMS templates (all optimized for ≤160 characters)
INSERT INTO public.sms_templates (template_name, event_type, message_template, is_global, allow_tenant_override, variables, is_active, estimated_sms_count, character_count_warning) VALUES

-- 1️⃣ Booking Confirmation
('Booking Confirmation', 'booking_confirmation', '{hotel}: Booking {ref} confirmed for {guest}. Check-in {checkin}, out {checkout}. See details: {link}', true, true, '["hotel", "ref", "guest", "checkin", "checkout", "link"]', true, 1, false),

-- 2️⃣ Check-in Reminder  
('Check-in Reminder', 'check_in_reminder', 'Reminder: Your stay at {hotel} starts today. Booking {ref}. We look forward to welcoming you!', true, true, '["hotel", "ref"]', true, 1, false),

-- 3️⃣ Check-out Reminder
('Check-out Reminder', 'check_out_reminder', '{guest}, checkout at {hotel} is tomorrow by 12PM. Need help? Reply or contact front desk.', true, true, '["guest", "hotel"]', true, 1, false),

-- 4️⃣ Payment Reminder
('Payment Reminder', 'payment_reminder', '{hotel}: Payment {amount} pending for booking {ref}. Please settle at front desk or via link: {link}', true, true, '["hotel", "amount", "ref", "link"]', true, 1, false),

-- 5️⃣ Booking Cancelled
('Booking Cancelled', 'booking_cancelled', '{hotel}: Booking {ref} for {guest} has been cancelled. Contact us if you wish to rebook.', true, true, '["hotel", "ref", "guest"]', true, 1, false),

-- 6️⃣ QR Order Confirmation
('QR Order Confirmation', 'qr_order_confirmation', '{hotel}: Order {ref} received from {room}. We''ll notify you when ready. Track here: {link}', true, true, '["hotel", "ref", "room", "link"]', true, 1, false),

-- 7️⃣ QR Order Ready
('QR Order Ready', 'qr_order_ready', '{hotel}: Order {ref} for {room} is ready for pickup/delivery. View: {link}', true, true, '["hotel", "ref", "room", "link"]', true, 1, false),

-- 8️⃣ Maintenance Alert
('Maintenance Alert', 'maintenance_alert', 'Maintenance alert: {issue} reported in {room}. Assigned to {staff}. See details: {link}', true, true, '["issue", "room", "staff", "link"]', true, 1, false),

-- 9️⃣ QR Order Request (Staff)
('QR Order Request', 'qr_order_request', 'New room request from {room}: {item}. Respond via {link}.', true, true, '["room", "item", "link"]', true, 1, false),

-- 🔟 Invoice/Payment Receipt
('Payment Receipt', 'payment_receipt', '{hotel}: Payment of {amount} received for {ref}. Thank you for staying with us!', true, true, '["hotel", "amount", "ref"]', true, 1, false),

-- 1️⃣1️⃣ Staff Duty Alert
('Staff Duty Alert', 'staff_duty_alert', '{staff}, your shift starts soon at {hotel}. Login to app for today''s tasks.', true, true, '["staff", "hotel"]', true, 1, false),

-- 1️⃣2️⃣ Low SMS Credit Alert
('Low SMS Credits Alert', 'sms_credits_low', '{hotel}: SMS credits low. Auto-disable at 0. Buy addon in dashboard: {link}', true, true, '["hotel", "link"]', true, 1, false);