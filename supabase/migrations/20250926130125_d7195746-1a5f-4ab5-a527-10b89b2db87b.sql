-- Drop the existing tenant_id constraint that's missing SUPPORT_ADMIN
ALTER TABLE users DROP CONSTRAINT users_tenant_id_check;

-- Add updated constraint that includes SUPPORT_ADMIN in global roles
ALTER TABLE users ADD CONSTRAINT users_tenant_id_check 
CHECK ((
  ((tenant_id IS NULL) AND (role = ANY (ARRAY['SUPER_ADMIN'::text, 'PLATFORM_ADMIN'::text, 'SUPPORT_ADMIN'::text, 'SUPPORT_STAFF'::text]))) 
  OR 
  ((tenant_id IS NOT NULL) AND (role <> ALL (ARRAY['SUPER_ADMIN'::text, 'PLATFORM_ADMIN'::text, 'SUPPORT_ADMIN'::text, 'SUPPORT_STAFF'::text])))
));