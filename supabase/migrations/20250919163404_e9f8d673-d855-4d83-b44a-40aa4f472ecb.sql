-- Seed initial data for testing Phase 2 Backend Integration

-- Insert sample plans
INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) VALUES
('Starter', 29.99, 299.99, 10, 5, '{"frontdesk": true, "housekeeping": true, "basic_reports": true}', 14),
('Growth', 79.99, 799.99, 50, 20, '{"frontdesk": true, "housekeeping": true, "maintenance": true, "pos": true, "advanced_reports": true}', 14),
('Pro', 149.99, 1499.99, 200, 100, '{"frontdesk": true, "housekeeping": true, "maintenance": true, "pos": true, "advanced_reports": true, "api_access": true, "custom_branding": true}', 14)
ON CONFLICT (name) DO NOTHING;

-- Insert sample tenant
INSERT INTO public.tenants (
  hotel_name, hotel_slug, email, phone, address, city, country, currency,
  plan_id, subscription_status, trial_end, brand_colors, settings
) VALUES (
  'Grand Palace Lagos', 'grand-palace-lagos', 'info@grandpalacelagos.com', '+234-123-456-7890',
  '123 Victoria Island', 'Lagos', 'Nigeria', 'NGN',
  (SELECT id FROM public.plans WHERE name = 'Growth' LIMIT 1),
  'trialing',
  (NOW() + INTERVAL '30 days'),
  '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#f59e0b"}',
  '{"checkin_auto_assign": true, "checkout_auto_clean": true}'
)
ON CONFLICT (hotel_slug) DO NOTHING;

-- Get the tenant ID for subsequent inserts
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT tenant_id INTO tenant_uuid FROM public.tenants WHERE hotel_slug = 'grand-palace-lagos';
  
  -- Insert sample room types
  INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities) VALUES
  (tenant_uuid, 'Standard Room', 'Comfortable room with basic amenities', 15000, 2, '["Wi-Fi", "AC", "TV", "Mini Fridge"]'),
  (tenant_uuid, 'Deluxe Room', 'Spacious room with premium amenities', 25000, 3, '["Wi-Fi", "AC", "TV", "Mini Fridge", "Balcony", "Work Desk"]'),
  (tenant_uuid, 'Suite', 'Luxury suite with separate living area', 45000, 4, '["Wi-Fi", "AC", "TV", "Mini Fridge", "Balcony", "Work Desk", "Living Area", "Kitchenette"]')
  ON CONFLICT DO NOTHING;

  -- Insert sample rooms
  INSERT INTO public.rooms (tenant_id, room_number, room_type_id, floor, status) VALUES
  (tenant_uuid, '101', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Standard Room'), 1, 'available'),
  (tenant_uuid, '102', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Standard Room'), 1, 'available'),
  (tenant_uuid, '103', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Standard Room'), 1, 'dirty'),
  (tenant_uuid, '201', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Deluxe Room'), 2, 'available'),
  (tenant_uuid, '202', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Deluxe Room'), 2, 'occupied'),
  (tenant_uuid, '203', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Deluxe Room'), 2, 'available'),
  (tenant_uuid, '301', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Suite'), 3, 'available'),
  (tenant_uuid, '302', (SELECT id FROM public.room_types WHERE tenant_id = tenant_uuid AND name = 'Suite'), 3, 'maintenance')
  ON CONFLICT DO NOTHING;

  -- Insert sample reservation for occupied room
  INSERT INTO public.reservations (
    tenant_id, room_id, reservation_number, guest_name, guest_email, guest_phone,
    check_in_date, check_out_date, adults, children, room_rate, total_amount, status
  ) VALUES (
    tenant_uuid,
    (SELECT id FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '202'),
    'RES-2024-001',
    'John Smith',
    'john.smith@email.com',
    '+234-987-654-3210',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    2, 0, 25000, 75000, 'checked_in'
  )
  ON CONFLICT DO NOTHING;

  -- Insert sample supplies
  INSERT INTO public.supplies (tenant_id, name, category, current_stock, minimum_stock, maximum_stock, unit, unit_cost) VALUES
  (tenant_uuid, 'Bath Towels', 'bathroom', 45, 20, 100, 'pieces', 25.00),
  (tenant_uuid, 'Toilet Paper', 'bathroom', 8, 15, 50, 'rolls', 12.50),
  (tenant_uuid, 'Bed Sheets', 'bedding', 30, 25, 80, 'sets', 45.00),
  (tenant_uuid, 'All-Purpose Cleaner', 'cleaning', 12, 10, 30, 'bottles', 18.00),
  (tenant_uuid, 'Shampoo Bottles', 'amenities', 25, 15, 60, 'bottles', 8.50)
  ON CONFLICT DO NOTHING;

  -- Insert sample menu categories
  INSERT INTO public.menu_categories (tenant_id, name, description, display_order) VALUES
  (tenant_uuid, 'Appetizers', 'Start your meal with our delicious appetizers', 1),
  (tenant_uuid, 'Main Course', 'Our signature dishes and hearty meals', 2),
  (tenant_uuid, 'Beverages', 'Refreshing drinks and specialty beverages', 3),
  (tenant_uuid, 'Desserts', 'Sweet endings to your meal', 4)
  ON CONFLICT DO NOTHING;

  -- Insert sample menu items
  INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, preparation_time, dietary_info) VALUES
  (tenant_uuid, (SELECT id FROM public.menu_categories WHERE tenant_id = tenant_uuid AND name = 'Appetizers'), 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 1500, 10, '["Vegetarian"]'),
  (tenant_uuid, (SELECT id FROM public.menu_categories WHERE tenant_id = tenant_uuid AND name = 'Main Course'), 'Grilled Chicken', 'Tender grilled chicken breast with herbs and spices', 3500, 25, '["Gluten-Free"]'),
  (tenant_uuid, (SELECT id FROM public.menu_categories WHERE tenant_id = tenant_uuid AND name = 'Main Course'), 'Jollof Rice', 'Traditional Nigerian jollof rice with chicken', 2800, 20, '[]'),
  (tenant_uuid, (SELECT id FROM public.menu_categories WHERE tenant_id = tenant_uuid AND name = 'Beverages'), 'Fresh Orange Juice', 'Freshly squeezed orange juice', 800, 5, '["Vegan"]'),
  (tenant_uuid, (SELECT id FROM public.menu_categories WHERE tenant_id = tenant_uuid AND name = 'Desserts'), 'Chocolate Cake', 'Rich chocolate cake with cream frosting', 1200, 5, '["Vegetarian"]')
  ON CONFLICT DO NOTHING;

  -- Insert sample housekeeping tasks
  INSERT INTO public.housekeeping_tasks (tenant_id, room_id, title, description, task_type, priority, status, estimated_minutes) VALUES
  (tenant_uuid, (SELECT id FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '103'), 'Post-checkout Cleaning', 'Deep clean room after guest checkout', 'cleaning', 'high', 'pending', 45),
  (tenant_uuid, (SELECT id FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '301'), 'Amenity Restock', 'Restock bathroom amenities and minibar', 'amenity', 'medium', 'pending', 15)
  ON CONFLICT DO NOTHING;

  -- Insert sample work orders
  INSERT INTO public.work_orders (tenant_id, room_id, work_order_number, title, description, category, priority, status, estimated_hours) VALUES
  (tenant_uuid, (SELECT id FROM public.rooms WHERE tenant_id = tenant_uuid AND room_number = '302'), 'WO-302-001', 'AC Repair', 'Air conditioning unit not cooling properly', 'HVAC', 'high', 'pending', 2),
  (tenant_uuid, NULL, 'WO-POOL-001', 'Pool Maintenance', 'Weekly pool cleaning and chemical balance', 'Maintenance', 'medium', 'pending', 3)
  ON CONFLICT DO NOTHING;

END $$;