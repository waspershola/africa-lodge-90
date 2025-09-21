-- Function to create default tenant roles for a new tenant
CREATE OR REPLACE FUNCTION public.create_default_tenant_roles(tenant_uuid UUID)
RETURNS VOID AS $$
DECLARE
  owner_role_id UUID;
  manager_role_id UUID;
  front_desk_role_id UUID;
  housekeeping_role_id UUID;
  accounting_role_id UUID;
  maintenance_role_id UUID;
BEGIN
  -- Insert default tenant roles
  INSERT INTO public.roles (name, description, scope, tenant_id, is_system) VALUES
    ('Owner', 'Full control over the hotel', 'tenant', tenant_uuid, true),
    ('Manager', 'Manages day-to-day operations', 'tenant', tenant_uuid, true),
    ('Front Desk', 'Check-in/out and reservations', 'tenant', tenant_uuid, true),
    ('Housekeeping', 'Room cleaning and maintenance', 'tenant', tenant_uuid, true),
    ('Accounting', 'Billing and financial management', 'tenant', tenant_uuid, true),
    ('Maintenance', 'Facility maintenance and repairs', 'tenant', tenant_uuid, true);

  -- Get role IDs
  SELECT id INTO owner_role_id FROM public.roles 
  WHERE name = 'Owner' AND tenant_id = tenant_uuid;
  
  SELECT id INTO manager_role_id FROM public.roles 
  WHERE name = 'Manager' AND tenant_id = tenant_uuid;
  
  SELECT id INTO front_desk_role_id FROM public.roles 
  WHERE name = 'Front Desk' AND tenant_id = tenant_uuid;
  
  SELECT id INTO housekeeping_role_id FROM public.roles 
  WHERE name = 'Housekeeping' AND tenant_id = tenant_uuid;
  
  SELECT id INTO accounting_role_id FROM public.roles 
  WHERE name = 'Accounting' AND tenant_id = tenant_uuid;
  
  SELECT id INTO maintenance_role_id FROM public.roles 
  WHERE name = 'Maintenance' AND tenant_id = tenant_uuid;

  -- Assign permissions to Owner role (all tenant permissions)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT owner_role_id, p.id
  FROM public.permissions p
  WHERE p.module IN ('dashboard', 'reservations', 'billing', 'rooms', 'staff', 'housekeeping', 'maintenance', 'reports', 'settings');

  -- Assign permissions to Manager role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT manager_role_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read', 
    'reservations.read', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
    'billing.read', 'billing.write',
    'rooms.read', 'rooms.write',
    'staff.read',
    'housekeeping.read', 'housekeeping.write',
    'maintenance.read', 'maintenance.write',
    'reports.read'
  );

  -- Assign permissions to Front Desk role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT front_desk_role_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'reservations.read', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
    'billing.read',
    'rooms.read'
  );

  -- Assign permissions to Housekeeping role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT housekeeping_role_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'rooms.read', 'rooms.write',
    'housekeeping.read', 'housekeeping.write'
  );

  -- Assign permissions to Accounting role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT accounting_role_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'billing.read', 'billing.write', 'billing.approve',
    'reports.read', 'reports.export'
  );

  -- Assign permissions to Maintenance role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT maintenance_role_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'rooms.read', 'rooms.write',
    'maintenance.read', 'maintenance.write'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the users table to use the new roles system
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.name
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  JOIN public.role_permissions rp ON rp.role_id = r.id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;