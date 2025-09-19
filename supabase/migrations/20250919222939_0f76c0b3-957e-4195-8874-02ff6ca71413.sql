-- Seed initial data for Phase 2 Backend Integration

-- Insert plans
INSERT INTO public.plans (id, name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) VALUES 
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Starter',
  29.99,
  299.99,
  10,
  5,
  '{"qr_services": true, "basic_reporting": true, "standard_support": true}',
  14
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Growth', 
  59.99,
  599.99,
  25,
  15,
  '{"qr_services": true, "advanced_reporting": true, "priority_support": true, "multi_location": true}',
  14
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Pro',
  99.99,
  999.99,
  100,
  50,
  '{"qr_services": true, "advanced_reporting": true, "priority_support": true, "multi_location": true, "custom_branding": true, "api_access": true}',
  14
);

-- Insert demo tenant
INSERT INTO public.tenants (
  tenant_id,
  hotel_name,
  hotel_slug,
  plan_id,
  subscription_status,
  trial_start,
  trial_end,
  setup_completed,
  onboarding_step,
  currency,
  timezone,
  country,
  city,
  address,
  email,
  phone,
  settings,
  brand_colors
) VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Luxury Hotel & Resort',
  'luxury-hotel',
  '22222222-2222-2222-2222-222222222222'::uuid,
  'trialing',
  now(),
  now() + interval '14 days',
  true,
  'complete',
  'NGN',
  'Africa/Lagos',
  'Nigeria',
  'Lagos',
  '123 Victoria Island, Lagos, Nigeria',
  'owner@luxuryhotel.com',
  '+234-801-234-5678',
  '{"receipt_template": "modern", "tax_rate": 7.5, "service_charge": 10}',
  '{"primary": "#2563eb", "secondary": "#7c3aed", "accent": "#059669"}'
);

-- Create room types for the demo tenant
INSERT INTO public.room_types (id, tenant_id, name, description, base_rate, max_occupancy, amenities) VALUES
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Standard Room',
  'Comfortable standard room with modern amenities',
  15000.00,
  2,
  ARRAY['WiFi', 'Air Conditioning', 'TV', 'Mini Fridge']
),
(
  '66666666-6666-6666-6666-666666666666'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Deluxe Suite',
  'Spacious deluxe suite with premium amenities',
  25000.00,
  4,
  ARRAY['WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Balcony', 'Room Service']
),
(
  '77777777-7777-7777-7777-777777777777'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Presidential Suite', 
  'Luxurious presidential suite with all premium amenities',
  50000.00,
  6,
  ARRAY['WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Balcony', 'Room Service', 'Jacuzzi', 'Butler Service']
);

-- Create sample rooms
INSERT INTO public.rooms (id, tenant_id, room_number, floor, room_type_id, status, notes) VALUES
('88888881-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '101', 1, '55555555-5555-5555-5555-555555555555'::uuid, 'available', NULL),
('88888882-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '102', 1, '55555555-5555-5555-5555-555555555555'::uuid, 'available', NULL),
('88888883-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '103', 1, '55555555-5555-5555-5555-555555555555'::uuid, 'occupied', NULL),
('88888884-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '201', 2, '66666666-6666-6666-6666-666666666666'::uuid, 'available', NULL),
('88888885-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '202', 2, '66666666-6666-6666-6666-666666666666'::uuid, 'maintenance', 'AC repair needed'),
('88888886-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '301', 3, '77777777-7777-7777-7777-777777777777'::uuid, 'available', NULL);

-- Create menu categories for POS
INSERT INTO public.menu_categories (id, tenant_id, name, description, display_order, is_active) VALUES
('99999991-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Appetizers', 'Start your meal right', 1, true),
('99999992-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Main Course', 'Hearty main dishes', 2, true),
('99999993-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Beverages', 'Refreshing drinks', 3, true),
('99999994-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Desserts', 'Sweet endings', 4, true);

-- Create sample menu items
INSERT INTO public.menu_items (id, tenant_id, category_id, name, description, price, is_available, preparation_time, dietary_info, tags) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '99999991-9999-9999-9999-999999999999'::uuid, 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 2500.00, true, 10, ARRAY['Vegetarian'], ARRAY['popular']),
('aaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '99999992-9999-9999-9999-999999999999'::uuid, 'Grilled Chicken', 'Perfectly grilled chicken breast with herbs', 4500.00, true, 25, ARRAY['Gluten-Free'], ARRAY['signature']),
('aaaaaaac-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '99999993-9999-9999-9999-999999999999'::uuid, 'Fresh Orange Juice', '100% pure orange juice', 800.00, true, 5, ARRAY['Vegan', 'Gluten-Free'], ARRAY['healthy']),
('aaaaaaad-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '99999994-9999-9999-9999-999999999999'::uuid, 'Chocolate Cake', 'Rich chocolate cake with cream', 1800.00, true, 15, ARRAY['Vegetarian'], ARRAY['popular']);

-- Create supplies for housekeeping
INSERT INTO public.supplies (id, tenant_id, name, category, unit, current_stock, minimum_stock, maximum_stock, unit_cost, is_active) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Toilet Paper', 'bathroom', 'rolls', 50, 10, 100, 150.00, true),
('bbbbbbbc-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Towels', 'linen', 'pieces', 25, 5, 50, 2500.00, true),
('bbbbbbbd-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Room Spray', 'cleaning', 'bottles', 15, 5, 30, 800.00, true),
('bbbbbbbe-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Bed Sheets', 'linen', 'sets', 20, 5, 40, 3500.00, true);