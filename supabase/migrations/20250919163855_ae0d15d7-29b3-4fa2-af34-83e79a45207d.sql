-- Insert sample room types and rooms for the test tenant (fixed array format)
DO $$
DECLARE
  tenant_uuid UUID;
  standard_room_type_id UUID;
  deluxe_room_type_id UUID;
  suite_room_type_id UUID;
BEGIN
  -- Get the tenant ID
  SELECT tenant_id INTO tenant_uuid FROM public.tenants WHERE hotel_slug = 'grand-palace-lagos' LIMIT 1;
  
  IF tenant_uuid IS NOT NULL THEN
    -- Insert room types with correct array format
    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) 
    SELECT tenant_uuid, 'Standard Room', 'Comfortable room with basic amenities', 15000, 2, ARRAY['Wi-Fi', 'AC', 'TV', 'Mini Fridge']
    WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Standard Room');

    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) 
    SELECT tenant_uuid, 'Deluxe Room', 'Spacious room with premium amenities', 25000, 3, ARRAY['Wi-Fi', 'AC', 'TV', 'Mini Fridge', 'Balcony', 'Work Desk']
    WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Deluxe Room');

    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) 
    SELECT tenant_uuid, 'Suite', 'Luxury suite with separate living area', 45000, 4, ARRAY['Wi-Fi', 'AC', 'TV', 'Mini Fridge', 'Balcony', 'Work Desk', 'Living Area', 'Kitchenette']
    WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Suite');

  END IF;
END $$;