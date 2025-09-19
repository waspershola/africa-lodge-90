-- Simple seed data without problematic supplies table

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
);

-- Create sample rooms
INSERT INTO public.rooms (id, tenant_id, room_number, floor, room_type_id, status, notes) VALUES
('88888881-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '101', 1, '55555555-5555-5555-5555-555555555555'::uuid, 'available', NULL),
('88888882-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '102', 1, '55555555-5555-5555-5555-555555555555'::uuid, 'available', NULL),
('88888883-8888-8888-8888-888888888888'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '201', 2, '66666666-6666-6666-6666-666666666666'::uuid, 'available', NULL);

-- Create menu categories for POS
INSERT INTO public.menu_categories (id, tenant_id, name, description, display_order, is_active) VALUES
('99999991-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Appetizers', 'Start your meal right', 1, true),
('99999992-9999-9999-9999-999999999999'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Main Course', 'Hearty main dishes', 2, true);

-- Create sample menu items
INSERT INTO public.menu_items (id, tenant_id, category_id, name, description, price, is_available, preparation_time, dietary_info, tags) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '99999991-9999-9999-9999-999999999999'::uuid, 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 2500.00, true, 10, ARRAY['Vegetarian'], ARRAY['popular']),
('aaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '99999992-9999-9999-9999-999999999999'::uuid, 'Grilled Chicken', 'Perfectly grilled chicken breast with herbs', 4500.00, true, 25, ARRAY['Gluten-Free'], ARRAY['signature']);