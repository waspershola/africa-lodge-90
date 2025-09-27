-- Update demo_config table to use LUXURYHOTELPRO branding
UPDATE demo_config 
SET 
  title = 'See LUXURYHOTELPRO in Action',
  description = 'Watch how hotels worldwide are transforming their operations with our comprehensive management platform.',
  updated_at = now()
WHERE title LIKE '%LuxuryHotelSaaS%' OR title LIKE '%LuxuryHotelSaaS%';