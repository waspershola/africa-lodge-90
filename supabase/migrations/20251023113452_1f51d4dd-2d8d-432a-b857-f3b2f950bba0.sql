-- Fix existing QR codes to use consistent Supabase URL
-- This updates all QR codes that were created with custom or preview domain URLs

-- Update all luxuryhotelpro.com URLs to use Supabase URL
UPDATE qr_codes 
SET qr_code_url = REPLACE(
  qr_code_url, 
  'https://luxuryhotelpro.com', 
  'https://dxisnnjsbuuiunjmzzqj.supabase.co'
)
WHERE qr_code_url LIKE 'https://luxuryhotelpro.com%';

-- Update all preview URLs to use Supabase URL
UPDATE qr_codes 
SET qr_code_url = REPLACE(
  qr_code_url, 
  'https://preview--africa-lodge-90.lovable.app', 
  'https://dxisnnjsbuuiunjmzzqj.supabase.co'
)
WHERE qr_code_url LIKE 'https://preview--africa-lodge-90.lovable.app%';

-- Update any other potential preview URLs (catch-all for preview domains)
UPDATE qr_codes 
SET qr_code_url = REGEXP_REPLACE(
  qr_code_url,
  'https://preview--[a-z0-9-]+\.lovable\.app',
  'https://dxisnnjsbuuiunjmzzqj.supabase.co',
  'g'
)
WHERE qr_code_url ~ 'https://preview--[a-z0-9-]+\.lovable\.app';