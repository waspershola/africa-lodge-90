-- Insert default global roles and permissions

-- Insert default global roles
INSERT INTO public.roles (name, description, scope, is_system) VALUES
  ('Super Admin', 'Full control of the entire platform', 'global', true),
  ('Platform Admin', 'Limited global rights for platform management', 'global', true),
  ('Support Staff', 'Read-only access for customer support', 'global', true);

-- Insert default permissions
INSERT INTO public.permissions (name, description, module, action) VALUES
  -- Dashboard permissions
  ('dashboard.read', 'View dashboard and analytics', 'dashboard', 'read'),
  
  -- Reservations permissions
  ('reservations.read', 'View reservations', 'reservations', 'read'),
  ('reservations.write', 'Create and update reservations', 'reservations', 'write'),
  ('reservations.delete', 'Cancel reservations', 'reservations', 'delete'),
  ('reservations.checkin', 'Check-in guests', 'reservations', 'checkin'),
  ('reservations.checkout', 'Check-out guests', 'reservations', 'checkout'),
  
  -- Billing permissions
  ('billing.read', 'View billing information', 'billing', 'read'),
  ('billing.write', 'Create and update bills', 'billing', 'write'),
  ('billing.approve', 'Approve payments and charges', 'billing', 'approve'),
  
  -- Rooms permissions
  ('rooms.read', 'View room information', 'rooms', 'read'),
  ('rooms.write', 'Update room status and details', 'rooms', 'write'),
  ('rooms.manage', 'Full room management', 'rooms', 'manage'),
  
  -- Staff permissions
  ('staff.read', 'View staff information', 'staff', 'read'),
  ('staff.write', 'Manage staff accounts', 'staff', 'write'),
  ('staff.invite', 'Invite new staff members', 'staff', 'invite'),
  
  -- Housekeeping permissions
  ('housekeeping.read', 'View housekeeping tasks', 'housekeeping', 'read'),
  ('housekeeping.write', 'Manage housekeeping tasks', 'housekeeping', 'write'),
  
  -- Maintenance permissions
  ('maintenance.read', 'View maintenance requests', 'maintenance', 'read'),
  ('maintenance.write', 'Manage maintenance requests', 'maintenance', 'write'),
  
  -- Reports permissions
  ('reports.read', 'View reports', 'reports', 'read'),
  ('reports.export', 'Export reports', 'reports', 'export'),
  
  -- Settings permissions
  ('settings.read', 'View settings', 'settings', 'read'),
  ('settings.write', 'Manage settings', 'settings', 'write'),
  
  -- Global admin permissions
  ('tenants.read', 'View all tenants', 'tenants', 'read'),
  ('tenants.write', 'Manage tenants', 'tenants', 'write'),
  ('tenants.delete', 'Delete tenants', 'tenants', 'delete'),
  ('system.manage', 'Manage system settings', 'system', 'manage');

-- Assign permissions to global roles
DO $$
DECLARE
  super_admin_id UUID;
  platform_admin_id UUID;
  support_staff_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'Super Admin' AND scope = 'global';
  SELECT id INTO platform_admin_id FROM public.roles WHERE name = 'Platform Admin' AND scope = 'global';
  SELECT id INTO support_staff_id FROM public.roles WHERE name = 'Support Staff' AND scope = 'global';

  -- Super Admin gets all permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT super_admin_id, p.id FROM public.permissions p;

  -- Platform Admin gets read/write for tenants but not delete
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT platform_admin_id, p.id
  FROM public.permissions p
  WHERE p.name IN ('tenants.read', 'tenants.write', 'system.manage', 'dashboard.read', 'reports.read', 'reports.export');

  -- Support Staff gets read-only access
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT support_staff_id, p.id
  FROM public.permissions p
  WHERE p.action = 'read';
END $$;