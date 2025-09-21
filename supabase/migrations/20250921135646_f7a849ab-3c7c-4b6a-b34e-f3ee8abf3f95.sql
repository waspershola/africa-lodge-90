-- First, ensure all required permissions exist
INSERT INTO public.permissions (name, description, module, action) VALUES
-- Dashboard permissions
('dashboard.read', 'View dashboard', 'dashboard', 'read'),

-- Reservations permissions
('reservations.read', 'View reservations', 'reservations', 'read'),
('reservations.write', 'Create and update reservations', 'reservations', 'write'),
('reservations.delete', 'Delete reservations', 'reservations', 'delete'),
('reservations.checkin', 'Check in guests', 'reservations', 'checkin'),
('reservations.checkout', 'Check out guests', 'reservations', 'checkout'),

-- Billing permissions
('billing.read', 'View billing information', 'billing', 'read'),
('billing.write', 'Create and update bills', 'billing', 'write'),
('billing.delete', 'Delete billing records', 'billing', 'delete'),
('billing.approve', 'Approve payments and charges', 'billing', 'approve'),

-- Rooms permissions
('rooms.read', 'View rooms', 'rooms', 'read'),
('rooms.write', 'Update room information', 'rooms', 'write'),
('rooms.manage', 'Full room management', 'rooms', 'manage'),

-- Staff permissions
('staff.read', 'View staff information', 'staff', 'read'),
('staff.write', 'Update staff information', 'staff', 'write'),
('staff.invite', 'Invite new staff members', 'staff', 'invite'),
('staff.manage', 'Full staff management', 'staff', 'manage'),

-- Housekeeping permissions
('housekeeping.read', 'View housekeeping tasks', 'housekeeping', 'read'),
('housekeeping.write', 'Create and update housekeeping tasks', 'housekeeping', 'write'),
('housekeeping.manage', 'Full housekeeping management', 'housekeeping', 'manage'),

-- Maintenance permissions
('maintenance.read', 'View maintenance requests', 'maintenance', 'read'),
('maintenance.write', 'Create and update maintenance requests', 'maintenance', 'write'),
('maintenance.manage', 'Full maintenance management', 'maintenance', 'manage'),

-- Reports permissions
('reports.read', 'View reports', 'reports', 'read'),
('reports.export', 'Export reports', 'reports', 'export'),

-- Settings permissions
('settings.read', 'View settings', 'settings', 'read'),
('settings.write', 'Update settings', 'settings', 'write'),

-- Global permissions (Super Admin only)
('tenants.read', 'View tenant information', 'tenants', 'read'),
('tenants.write', 'Create and update tenants', 'tenants', 'write'),
('tenants.delete', 'Delete tenants', 'tenants', 'delete'),
('tenants.manage', 'Full tenant management', 'tenants', 'manage'),

('system.read', 'View system information', 'system', 'read'),
('system.write', 'Update system settings', 'system', 'write'),
('system.manage', 'Full system management', 'system', 'manage')

ON CONFLICT (name) DO NOTHING;

-- Create global system roles if they don't exist
INSERT INTO public.roles (name, description, scope, is_system) VALUES
('Super Admin', 'Full control of the entire platform', 'global', true),
('Platform Admin', 'Limited global rights for platform management', 'global', true),
('Support Staff', 'Read-only access for customer support', 'global', true)
ON CONFLICT DO NOTHING;

-- Get role IDs for permissions assignment
DO $$
DECLARE
  super_admin_id UUID;
  platform_admin_id UUID;
  support_staff_id UUID;
BEGIN
  -- Get global role IDs
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'Super Admin' AND scope = 'global';
  SELECT id INTO platform_admin_id FROM public.roles WHERE name = 'Platform Admin' AND scope = 'global';
  SELECT id INTO support_staff_id FROM public.roles WHERE name = 'Support Staff' AND scope = 'global';

  -- Assign permissions to Super Admin (all permissions)
  IF super_admin_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT super_admin_id, p.id
    FROM public.permissions p
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign permissions to Platform Admin (limited global + view permissions)
  IF platform_admin_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT platform_admin_id, p.id
    FROM public.permissions p
    WHERE p.name IN (
      'tenants.read', 'tenants.write',
      'system.read', 'system.write',
      'dashboard.read', 'reports.read', 'reports.export'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign permissions to Support Staff (read-only)
  IF support_staff_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT support_staff_id, p.id
    FROM public.permissions p
    WHERE p.name IN (
      'tenants.read', 'dashboard.read', 'reservations.read',
      'rooms.read', 'reports.read'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;