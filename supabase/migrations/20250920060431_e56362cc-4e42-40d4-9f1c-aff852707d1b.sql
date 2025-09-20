-- Phase 2 Data Seeding: Insert sample data for testing

-- Insert sample plans
INSERT INTO plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) VALUES 
('Starter', 99.00, 990.00, 20, 5, '{"pos": false, "maintenance": true, "housekeeping": true, "analytics": "basic"}', 14),
('Growth', 199.00, 1990.00, 50, 15, '{"pos": true, "maintenance": true, "housekeeping": true, "analytics": "advanced"}', 14),
('Pro', 399.00, 3990.00, 200, 50, '{"pos": true, "maintenance": true, "housekeeping": true, "analytics": "premium", "api_access": true}', 14)
ON CONFLICT (name) DO NOTHING;

-- Insert sample tenant (Grand Palace Lagos)
INSERT INTO tenants (
  hotel_name, 
  hotel_slug, 
  email, 
  phone, 
  address,
  city, 
  country, 
  currency, 
  timezone,
  plan_id,
  subscription_status,
  setup_completed,
  brand_colors,
  settings
) 
SELECT 
  'Grand Palace Lagos',
  'grand-palace-lagos',
  'owner@grandpalacelagos.com',
  '+234 123 456 7890',
  '123 Victoria Island',
  'Lagos',
  'Nigeria',
  'NGN',
  'Africa/Lagos',
  p.id,
  'active',
  true,
  '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#f59e0b"}',
  '{"onboarding_completed": true, "demo_data": true}'
FROM plans p 
WHERE p.name = 'Growth'
AND NOT EXISTS (SELECT 1 FROM tenants WHERE hotel_slug = 'grand-palace-lagos');

-- Get tenant_id for subsequent inserts
DO $$
DECLARE
  sample_tenant_id UUID;
  owner_user_id UUID;
  manager_user_id UUID;
  frontdesk_user_id UUID;
  housekeeping_user_id UUID;
  standard_room_type_id UUID;
  deluxe_room_type_id UUID;
  suite_room_type_id UUID;
BEGIN
  -- Get the tenant ID
  SELECT tenant_id INTO sample_tenant_id FROM tenants WHERE hotel_slug = 'grand-palace-lagos';
  
  IF sample_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Sample tenant not found';
  END IF;

  -- Insert sample users (staff members)
  INSERT INTO users (email, name, role, tenant_id, is_active, department) VALUES
  ('owner@grandpalacelagos.com', 'John Adebayo', 'OWNER', sample_tenant_id, true, 'Management'),
  ('manager@grandpalacelagos.com', 'Sarah Okonkwo', 'MANAGER', sample_tenant_id, true, 'Operations'),
  ('frontdesk@grandpalacelagos.com', 'Michael Eze', 'FRONT_DESK', sample_tenant_id, true, 'Front Office'),
  ('housekeeping@grandpalacelagos.com', 'Fatima Hassan', 'HOUSEKEEPING', sample_tenant_id, true, 'Housekeeping'),
  ('pos@grandpalacelagos.com', 'David Okoro', 'POS', sample_tenant_id, true, 'Restaurant'),
  ('maintenance@grandpalacelagos.com', 'Ibrahim Musa', 'MAINTENANCE', sample_tenant_id, true, 'Engineering')
  ON CONFLICT (email) DO NOTHING;

  -- Get user IDs for references
  SELECT id INTO owner_user_id FROM users WHERE email = 'owner@grandpalacelagos.com';
  SELECT id INTO manager_user_id FROM users WHERE email = 'manager@grandpalacelagos.com';
  SELECT id INTO frontdesk_user_id FROM users WHERE email = 'frontdesk@grandpalacelagos.com';
  SELECT id INTO housekeeping_user_id FROM users WHERE email = 'housekeeping@grandpalacelagos.com';

  -- Insert room types
  INSERT INTO room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) VALUES
  (sample_tenant_id, 'Standard', 'Comfortable standard room with city view', 25000, 2, ARRAY['WiFi', 'AC', 'TV', 'Mini Fridge']),
  (sample_tenant_id, 'Deluxe', 'Spacious deluxe room with premium amenities', 35000, 3, ARRAY['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony']),
  (sample_tenant_id, 'Suite', 'Luxury suite with separate living area', 55000, 4, ARRAY['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Kitchenette'])
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- Get room type IDs
  SELECT id INTO standard_room_type_id FROM room_types WHERE tenant_id = sample_tenant_id AND name = 'Standard';
  SELECT id INTO deluxe_room_type_id FROM room_types WHERE tenant_id = sample_tenant_id AND name = 'Deluxe';
  SELECT id INTO suite_room_type_id FROM room_types WHERE tenant_id = sample_tenant_id AND name = 'Suite';

  -- Insert sample rooms
  INSERT INTO rooms (tenant_id, room_number, room_type_id, floor, status) VALUES
  -- Floor 1 (Standard rooms)
  (sample_tenant_id, '101', standard_room_type_id, 1, 'available'),
  (sample_tenant_id, '102', standard_room_type_id, 1, 'occupied'),
  (sample_tenant_id, '103', standard_room_type_id, 1, 'available'),
  (sample_tenant_id, '104', standard_room_type_id, 1, 'dirty'),
  (sample_tenant_id, '105', standard_room_type_id, 1, 'available'),
  
  -- Floor 2 (Deluxe rooms)
  (sample_tenant_id, '201', deluxe_room_type_id, 2, 'occupied'),
  (sample_tenant_id, '202', deluxe_room_type_id, 2, 'available'),
  (sample_tenant_id, '203', deluxe_room_type_id, 2, 'available'),
  (sample_tenant_id, '204', deluxe_room_type_id, 2, 'maintenance'),
  (sample_tenant_id, '205', deluxe_room_type_id, 2, 'occupied'),
  
  -- Floor 3 (Suites)
  (sample_tenant_id, '301', suite_room_type_id, 3, 'available'),
  (sample_tenant_id, '302', suite_room_type_id, 3, 'occupied'),
  (sample_tenant_id, '303', suite_room_type_id, 3, 'available')
  ON CONFLICT (tenant_id, room_number) DO NOTHING;

  -- Insert sample reservations for occupied rooms
  INSERT INTO reservations (
    tenant_id, room_id, reservation_number, guest_name, guest_email, guest_phone,
    check_in_date, check_out_date, adults, children, room_rate, total_amount,
    status, created_by
  ) VALUES
  (sample_tenant_id, 
   (SELECT id FROM rooms WHERE tenant_id = sample_tenant_id AND room_number = '102'),
   'RES-2025-001', 'Chukwudi Okafor', 'c.okafor@email.com', '+234 801 234 5678',
   '2025-09-18', '2025-09-22', 2, 0, 25000, 100000, 'checked_in', manager_user_id),
  
  (sample_tenant_id,
   (SELECT id FROM rooms WHERE tenant_id = sample_tenant_id AND room_number = '201'),
   'RES-2025-002', 'Aisha Bello', 'a.bello@email.com', '+234 802 345 6789',
   '2025-09-19', '2025-09-21', 1, 1, 35000, 70000, 'checked_in', frontdesk_user_id),
   
  (sample_tenant_id,
   (SELECT id FROM rooms WHERE tenant_id = sample_tenant_id AND room_number = '205'),
   'RES-2025-003', 'James Williams', 'j.williams@email.com', '+234 803 456 7890',
   '2025-09-17', '2025-09-20', 2, 1, 35000, 105000, 'checked_in', frontdesk_user_id),
   
  (sample_tenant_id,
   (SELECT id FROM rooms WHERE tenant_id = sample_tenant_id AND room_number = '302'),
   'RES-2025-004', 'Ngozi Ibe', 'n.ibe@email.com', '+234 804 567 8901',
   '2025-09-20', '2025-09-25', 2, 0, 55000, 275000, 'checked_in', manager_user_id)
  ON CONFLICT (reservation_number) DO NOTHING;

  -- Insert sample menu categories and items for POS
  INSERT INTO menu_categories (tenant_id, name, description, display_order) VALUES
  (sample_tenant_id, 'Appetizers', 'Light bites and starters', 1),
  (sample_tenant_id, 'Main Courses', 'Hearty main dishes', 2),
  (sample_tenant_id, 'Beverages', 'Drinks and refreshments', 3),
  (sample_tenant_id, 'Desserts', 'Sweet endings', 4)
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- Insert sample menu items
  INSERT INTO menu_items (tenant_id, category_id, name, description, price, preparation_time, dietary_info) VALUES
  (sample_tenant_id, 
   (SELECT id FROM menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Main Courses'),
   'Jollof Rice with Grilled Chicken', 'Traditional Nigerian jollof rice served with perfectly grilled chicken', 3500, 25, ARRAY['Halal']),
  
  (sample_tenant_id,
   (SELECT id FROM menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Main Courses'),
   'Pepper Soup with Assorted Meat', 'Spicy Nigerian pepper soup with goat meat and beef', 4500, 30, ARRAY['Spicy', 'Halal']),
   
  (sample_tenant_id,
   (SELECT id FROM menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Beverages'),
   'Chapman', 'Nigerian cocktail with mixed fruits', 1500, 5, ARRAY['Non-Alcoholic']),
   
  (sample_tenant_id,
   (SELECT id FROM menu_categories WHERE tenant_id = sample_tenant_id AND name = 'Beverages'),
   'Zobo Drink', 'Refreshing hibiscus leaf drink', 800, 5, ARRAY['Herbal', 'Non-Alcoholic'])
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- Insert sample housekeeping supplies
  INSERT INTO supplies (tenant_id, name, category, unit, current_stock, minimum_stock, maximum_stock, unit_cost) VALUES
  (sample_tenant_id, 'Toilet Paper', 'Bathroom', 'Roll', 150, 50, 300, 200),
  (sample_tenant_id, 'Bed Sheets (White)', 'Linen', 'Set', 45, 20, 100, 2500),
  (sample_tenant_id, 'All-Purpose Cleaner', 'Cleaning', 'Bottle', 25, 10, 50, 800),
  (sample_tenant_id, 'Towels (Bath)', 'Linen', 'Piece', 80, 30, 150, 1200),
  (sample_tenant_id, 'Vacuum Bags', 'Equipment', 'Pack', 12, 5, 25, 500)
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- Insert sample housekeeping tasks
  INSERT INTO housekeeping_tasks (
    tenant_id, room_id, title, description, task_type, status, priority,
    assigned_to, created_by, estimated_minutes
  ) VALUES
  (sample_tenant_id,
   (SELECT id FROM rooms WHERE tenant_id = sample_tenant_id AND room_number = '104'),
   'Deep Clean Room 104', 'Complete deep cleaning after checkout', 'cleaning', 'assigned', 'high',
   housekeeping_user_id, manager_user_id, 60),
   
  (sample_tenant_id,
   (SELECT id FROM rooms WHERE tenant_id = sample_tenant_id AND room_number = '204'),
   'Maintenance Check Room 204', 'Fix AC unit in room 204', 'maintenance', 'pending', 'high',
   NULL, frontdesk_user_id, 120)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Sample data inserted successfully for tenant: %', sample_tenant_id;
END $$;