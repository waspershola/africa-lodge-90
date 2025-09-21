-- Fix existing users' role_id assignments

-- Update SUPER_ADMIN users to link to Super Admin role
UPDATE users 
SET role_id = (
  SELECT id FROM roles 
  WHERE name = 'Super Admin' 
  AND scope = 'global'
) 
WHERE role = 'SUPER_ADMIN' 
AND role_id IS NULL;

-- Update OWNER users to link to Owner role for their tenant
UPDATE users 
SET role_id = (
  SELECT r.id FROM roles r
  WHERE r.name = 'Owner' 
  AND r.scope = 'tenant' 
  AND r.tenant_id = users.tenant_id
) 
WHERE role = 'OWNER' 
AND role_id IS NULL
AND tenant_id IS NOT NULL;

-- Log the updates
INSERT INTO audit_log (action, resource_type, description, metadata)
VALUES (
  'SYSTEM_UPDATE',
  'USERS',
  'Fixed existing users role_id assignments for new role system',
  jsonb_build_object(
    'updated_super_admins', (SELECT COUNT(*) FROM users WHERE role = 'SUPER_ADMIN' AND role_id IS NOT NULL),
    'updated_owners', (SELECT COUNT(*) FROM users WHERE role = 'OWNER' AND role_id IS NOT NULL),
    'timestamp', NOW()
  )
);