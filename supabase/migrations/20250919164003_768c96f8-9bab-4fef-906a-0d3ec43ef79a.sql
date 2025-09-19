-- Insert sample rooms with correct status values
DO $$
DECLARE
  tenant_uuid UUID;
  standard_room_type_id UUID;
  deluxe_room_type_id UUID;
  suite_room_type_id UUID;
  room_202_id UUID;
BEGIN
  -- Get the tenant ID
  SELECT tenant_id INTO tenant_uuid FROM public.tenants WHERE hotel_slug = 'grand-palace-lagos' LIMIT 1;
  
  IF tenant_uuid IS NOT NULL THEN
    -- Get room type IDs
    SELECT id INTO standard_room_type_id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Standard Room';
    SELECT id INTO deluxe_room_type_id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Deluxe Room';
    SELECT id INTO suite_room_type_id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Suite';

    -- Insert sample rooms with valid status values
    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '101', standard_room_type_id, 1, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '101');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '102', standard_room_type_id, 1, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '102');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '103', standard_room_type_id, 1, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '103');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '201', deluxe_room_type_id, 2, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '201');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '202', deluxe_room_type_id, 2, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '202');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '301', suite_room_type_id, 3, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '301');

    INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) 
    SELECT tenant_uuid, '302', suite_room_type_id, 3, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '302');

    -- Insert sample supplies
    INSERT INTO public.supplies (tenant_id, name, category, current_stock, minimum_stock, maximum_stock, unit, unit_cost) 
    SELECT tenant_uuid, 'Bath Towels', 'bathroom', 45, 20, 100, 'pieces', 25.00
    WHERE NOT EXISTS (SELECT 1 FROM public.supplies WHERE tenant_id = tenant_uuid AND name = 'Bath Towels');

    INSERT INTO public.supplies (tenant_id, name, category, current_stock, minimum_stock, maximum_stock, unit, unit_cost) 
    SELECT tenant_uuid, 'Toilet Paper', 'bathroom', 8, 15, 50, 'rolls', 12.50
    WHERE NOT EXISTS (SELECT 1 FROM public.supplies WHERE tenant_id = tenant_uuid AND name = 'Toilet Paper');

    INSERT INTO public.supplies (tenant_id, name, category, current_stock, minimum_stock, maximum_stock, unit, unit_cost) 
    SELECT tenant_uuid, 'All-Purpose Cleaner', 'cleaning', 12, 10, 30, 'bottles', 18.00
    WHERE NOT EXISTS (SELECT 1 FROM public.supplies WHERE tenant_id = tenant_uuid AND name = 'All-Purpose Cleaner');

  END IF;
END $$;