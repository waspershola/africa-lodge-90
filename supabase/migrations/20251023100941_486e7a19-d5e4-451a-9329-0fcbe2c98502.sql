-- Fix security warning: Set search_path for trigger function
ALTER FUNCTION create_staff_notification_for_qr_request() SET search_path TO 'public';