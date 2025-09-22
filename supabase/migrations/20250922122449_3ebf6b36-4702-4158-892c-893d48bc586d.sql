-- Simplified fix: Just ensure global roles exist without conflicts
-- Use INSERT IGNORE equivalent (INSERT ... ON CONFLICT DO NOTHING with simpler condition)

INSERT INTO roles (name, description, scope, is_system) 
SELECT 'Super Admin', 'Platform super administrator with full access', 'global', true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Super Admin' AND scope = 'global');

INSERT INTO roles (name, description, scope, is_system) 
SELECT 'Platform Admin', 'Platform administrator with limited access', 'global', true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Platform Admin' AND scope = 'global');

INSERT INTO roles (name, description, scope, is_system) 
SELECT 'Support Staff', 'Customer support staff', 'global', true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Support Staff' AND scope = 'global');

INSERT INTO roles (name, description, scope, is_system) 
SELECT 'Sales', 'Sales team member', 'global', true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Sales' AND scope = 'global');