-- Insert default QR settings for existing tenants that don't have them yet
INSERT INTO public.qr_settings (tenant_id, hotel_name, hotel_logo_url, primary_color, show_logo_on_qr, default_services)
SELECT 
  t.tenant_id,
  t.hotel_name,
  t.logo_url,
  '#D4AF37',
  true,
  ARRAY['Wi-Fi', 'Room Service', 'Housekeeping']
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.qr_settings qs 
  WHERE qs.tenant_id = t.tenant_id
);