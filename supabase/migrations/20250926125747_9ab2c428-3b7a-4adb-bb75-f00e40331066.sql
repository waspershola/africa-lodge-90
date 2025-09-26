-- Drop the existing constraint that's missing SUPPORT_ADMIN
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Add updated constraint with SUPPORT_ADMIN included and SALES removed
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK ((role = ANY (ARRAY[
  'SUPER_ADMIN'::text, 
  'PLATFORM_ADMIN'::text, 
  'SUPPORT_ADMIN'::text,
  'SUPPORT_STAFF'::text, 
  'OWNER'::text, 
  'MANAGER'::text, 
  'FRONT_DESK'::text, 
  'HOUSEKEEPING'::text, 
  'MAINTENANCE'::text, 
  'ACCOUNTING'::text, 
  'POS'::text, 
  'STAFF'::text, 
  'HOTEL_OWNER'::text, 
  'HOTEL_MANAGER'::text, 
  'EVENT_MANAGER'::text, 
  'MARKETING'::text, 
  'SECURITY'::text, 
  'IT_ADMIN'::text, 
  'POS_STAFF'::text
])));