-- Insert sample room types and rooms for the test tenant
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
    -- Insert room types
    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) 
    SELECT tenant_uuid, 'Standard Room', 'Comfortable room with basic amenities', 15000, 2, '["Wi-Fi", "AC", "TV", "Mini Fridge"]'
    WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Standard Room');

    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) 
    SELECT tenant_uuid, 'Deluxe Room', 'Spacious room with premium amenities', 25000, 3, '["Wi-Fi", "AC", "TV", "Mini Fridge", "Balcony", "Work Desk"]'
    WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Deluxe Room');

    INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) 
    SELECT tenant_uuid, 'Suite', 'Luxury suite with separate living area', 45000, 4, '["Wi-Fi", "AC", "TV", "Mini Fridge", "Balcony", "Work Desk", "Living Area", "Kitchenette"]'
    WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Suite');

    -- Get room type IDs
    SELECT id INTO standard_room_type_id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Standard Room';
    SELECT id INTO deluxe_room_type_id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Deluxe Room';
    SELECT id INTO suite_room_type_id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Suite';

    -- Insert sample rooms
    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '101', standard_room_type_id, 1, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '101');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '102', standard_room_type_id, 1, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '102');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '103', standard_room_type_id, 1, 'dirty'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '103');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '201', deluxe_room_type_id, 2, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '201');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '202', deluxe_room_type_id, 2, 'occupied'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '202');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '301', suite_room_type_id, 3, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '301');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '302', suite_room_type_id, 3, 'maintenance'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '302');

  END IF;
END $$;