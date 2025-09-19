-- Simple seed data insertion without ON CONFLICT
-- Check if plans already exist and insert if not
DO $$
BEGIN
  -- Insert plans if they don't exist
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Starter') THEN
    INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
    VALUES ('Starter', 25000, 250000, 10, 5, '{"features": ["Basic POS", "Room Management", "Basic Reporting"]}'::jsonb, 14);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Growth') THEN
    INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
    VALUES ('Growth', 45000, 450000, 50, 20, '{"features": ["Advanced POS", "QR Services", "Analytics", "Multi-location"]}'::jsonb, 14);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Pro') THEN
    INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
    VALUES ('Pro', 75000, 750000, 200, 100, '{"features": ["Full Suite", "Custom Integrations", "Advanced Analytics", "White Label"]}'::jsonb, 14);
  END IF;
END$$;

-- Insert sample tenant if it doesn't exist
DO $$
DECLARE
  growth_plan_id uuid;
  sample_tenant_id uuid;
  standard_room_type_id uuid;
  deluxe_room_type_id uuid;
BEGIN
  -- Get the Growth plan ID
  SELECT id INTO growth_plan_id FROM public.plans WHERE name = 'Growth' LIMIT 1;
  
  -- Create sample tenant if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE hotel_slug = 'luxury-hotel-lagos') THEN
    INSERT INTO public.tenants (
      hotel_name, hotel_slug, email, phone, address, city, country, currency,
      plan_id, subscription_status, trial_start, trial_end
    ) VALUES (
      'Luxury Hotel Lagos', 'luxury-hotel-lagos', 'owner@luxuryhotel.com', '+234-1-234-5678',
      'Victoria Island, Lagos', 'Lagos', 'Nigeria', 'NGN',
      growth_plan_id, 'trialing', now(), now() + interval '14 days'
    );
  END IF;
  
  -- Get tenant ID
  SELECT tenant_id INTO sample_tenant_id FROM public.tenants WHERE hotel_slug = 'luxury-hotel-lagos' LIMIT 1;
  
  -- Create room types if they don't exist
  IF NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = sample_tenant_id AND name = 'Standard Room') THEN
    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities)
    VALUES (sample_tenant_id, 'Standard Room', 'Comfortable standard accommodation with modern amenities', 
            15000, 2, ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar']);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = sample_tenant_id AND name = 'Deluxe Room') THEN
    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities)
    VALUES (sample_tenant_id, 'Deluxe Room', 'Spacious deluxe room with premium amenities',
            25000, 3, ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Ocean View', 'Balcony']);
  END IF;
  
  -- Get room type IDs
  SELECT id INTO standard_room_type_id FROM public.room_types WHERE tenant_id = sample_tenant_id AND name = 'Standard Room';
  SELECT id INTO deluxe_room_type_id FROM public.room_types WHERE tenant_id = sample_tenant_id AND name = 'Deluxe Room';
  
  -- Create sample rooms if they don't exist
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = sample_tenant_id AND room_number = '101') THEN
    INSERT INTO public.rooms (tenant_id, room_number, floor, room_type_id, status)
    VALUES (sample_tenant_id, '101', 1, standard_room_type_id, 'available');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = sample_tenant_id AND room_number = '102') THEN
    INSERT INTO public.rooms (tenant_id, room_number, floor, room_type_id, status)
    VALUES (sample_tenant_id, '102', 1, standard_room_type_id, 'available');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = sample_tenant_id AND room_number = '103') THEN
    INSERT INTO public.rooms (tenant_id, room_number, floor, room_type_id, status)
    VALUES (sample_tenant_id, '103', 1, standard_room_type_id, 'occupied');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = sample_tenant_id AND room_number = '201') THEN
    INSERT INTO public.rooms (tenant_id, room_number, floor, room_type_id, status)
    VALUES (sample_tenant_id, '201', 2, deluxe_room_type_id, 'available');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = sample_tenant_id AND room_number = '202') THEN
    INSERT INTO public.rooms (tenant_id, room_number, floor, room_type_id, status)
    VALUES (sample_tenant_id, '202', 2, deluxe_room_type_id, 'maintenance');
  END IF;
END$$;