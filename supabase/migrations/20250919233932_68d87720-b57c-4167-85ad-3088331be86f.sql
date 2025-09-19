-- Seed initial system data for Phase 2 integration
-- Insert basic plans
INSERT INTO public.plans (name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) VALUES
('Starter', 25000, 250000, 10, 5, '{"features": ["Basic POS", "Room Management", "Basic Reporting"]}', 14),
('Growth', 45000, 450000, 50, 20, '{"features": ["Advanced POS", "QR Services", "Analytics", "Multi-location"]}', 14),
('Pro', 75000, 750000, 200, 100, '{"features": ["Full Suite", "Custom Integrations", "Advanced Analytics", "White Label"]}', 14)
ON CONFLICT DO NOTHING;

-- Create sample tenant for testing (Luxury Hotel)
INSERT INTO public.tenants (
  hotel_name, 
  hotel_slug, 
  email,
  phone,
  address,
  city,
  country,
  currency,
  plan_id,
  subscription_status,
  trial_start,
  trial_end
) 
SELECT 
  'Luxury Hotel Lagos',
  'luxury-hotel-lagos',
  'owner@luxuryhotel.com',
  '+234-1-234-5678',
  'Victoria Island, Lagos',
  'Lagos',
  'Nigeria',
  'NGN',
  id,
  'trialing',
  now(),
  now() + interval '14 days'
FROM public.plans 
WHERE name = 'Growth'
ON CONFLICT (hotel_slug) DO NOTHING;

-- Create room types for the sample hotel
WITH sample_tenant AS (
  SELECT tenant_id FROM public.tenants WHERE hotel_slug = 'luxury-hotel-lagos' LIMIT 1
)
INSERT INTO public.room_types (tenant_id, name, description, base_rate, max_occupancy, amenities)
SELECT 
  st.tenant_id,
  'Standard Room',
  'Comfortable standard accommodation with modern amenities',
  15000,
  2,
  ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar']
FROM sample_tenant st
UNION ALL
SELECT 
  st.tenant_id,
  'Deluxe Room', 
  'Spacious deluxe room with premium amenities',
  25000,
  3,
  ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Ocean View', 'Balcony']
FROM sample_tenant st
UNION ALL
SELECT 
  st.tenant_id,
  'Executive Suite',
  'Luxurious suite with separate living area', 
  50000,
  4,
  ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Ocean View', 'Balcony', 'Kitchenette', 'Living Room']
FROM sample_tenant st
ON CONFLICT DO NOTHING;

-- Create sample rooms
WITH sample_tenant AS (
  SELECT tenant_id FROM public.tenants WHERE hotel_slug = 'luxury-hotel-lagos' LIMIT 1
),
standard_type AS (
  SELECT rt.id as room_type_id 
  FROM public.room_types rt, sample_tenant st 
  WHERE rt.tenant_id = st.tenant_id AND rt.name = 'Standard Room'
),
deluxe_type AS (
  SELECT rt.id as room_type_id 
  FROM public.room_types rt, sample_tenant st 
  WHERE rt.tenant_id = st.tenant_id AND rt.name = 'Deluxe Room'  
)
INSERT INTO public.rooms (tenant_id, room_number, floor, room_type_id, status)
SELECT st.tenant_id, '101', 1, std.room_type_id, 'available' FROM sample_tenant st, standard_type std
UNION ALL
SELECT st.tenant_id, '102', 1, std.room_type_id, 'available' FROM sample_tenant st, standard_type std
UNION ALL
SELECT st.tenant_id, '103', 1, std.room_type_id, 'occupied' FROM sample_tenant st, standard_type std
UNION ALL  
SELECT st.tenant_id, '201', 2, dx.room_type_id, 'available' FROM sample_tenant st, deluxe_type dx
UNION ALL
SELECT st.tenant_id, '202', 2, dx.room_type_id, 'cleaning' FROM sample_tenant st, deluxe_type dx
ON CONFLICT DO NOTHING;