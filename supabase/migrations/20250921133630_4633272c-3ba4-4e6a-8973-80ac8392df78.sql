-- First, create proper role and permission system

-- Drop existing role-related tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;

-- Create role scope enum (global vs tenant)
CREATE TYPE public.role_scope AS ENUM ('global', 'tenant');

-- Create role table for both global and tenant roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scope role_scope NOT NULL DEFAULT 'tenant',
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  UNIQUE(name, tenant_id), -- Role names must be unique per tenant
  UNIQUE(name, scope) WHERE scope = 'global', -- Global role names must be globally unique
  CHECK ((scope = 'global' AND tenant_id IS NULL) OR (scope = 'tenant' AND tenant_id IS NOT NULL))
);

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL, -- e.g., 'reservations', 'billing', 'rooms'
  action TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'approve'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles table
CREATE POLICY "Super admin can manage all roles" ON public.roles
  FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view roles in own tenant" ON public.roles
  FOR SELECT USING (
    scope = 'global' OR 
    (scope = 'tenant' AND can_access_tenant(tenant_id))
  );

CREATE POLICY "Owners can manage tenant roles" ON public.roles
  FOR ALL USING (
    scope = 'tenant' AND 
    get_user_role() IN ('OWNER', 'MANAGER') AND 
    can_access_tenant(tenant_id)
  );

-- RLS policies for permissions table
CREATE POLICY "Everyone can view permissions" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "Super admin can manage permissions" ON public.permissions
  FOR ALL USING (is_super_admin());

-- RLS policies for role_permissions table
CREATE POLICY "Users can view role permissions" ON public.role_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.roles r 
      WHERE r.id = role_id AND (
        r.scope = 'global' OR 
        (r.scope = 'tenant' AND can_access_tenant(r.tenant_id))
      )
    )
  );

CREATE POLICY "Super admin can manage all role permissions" ON public.role_permissions
  FOR ALL USING (is_super_admin());

CREATE POLICY "Owners can manage tenant role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.roles r 
      WHERE r.id = role_id 
      AND r.scope = 'tenant' 
      AND get_user_role() IN ('OWNER', 'MANAGER')
      AND can_access_tenant(r.tenant_id)
    )
  );

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
    ('Maintenance', 'Facility maintenance and repairs', 'tenant', tenant_uuid, true)
  RETURNING id INTO owner_role_id, manager_role_id, front_desk_role_id, housekeeping_role_id, accounting_role_id, maintenance_role_id;

  -- Get role IDs (since RETURNING only gives us the last one)
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
-- First, let's add a new role_id column
ALTER TABLE public.users ADD COLUMN role_id UUID REFERENCES public.roles(id);

-- Create a function to migrate existing users to the new role system
CREATE OR REPLACE FUNCTION public.migrate_user_roles()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  role_record RECORD;
BEGIN
  -- Loop through all users and assign them appropriate roles
  FOR user_record IN SELECT * FROM public.users WHERE role_id IS NULL LOOP
    -- Find the appropriate role based on the old role field
    SELECT r.id INTO role_record
    FROM public.roles r
    WHERE r.tenant_id = user_record.tenant_id
    AND (
      (user_record.role = 'OWNER' AND r.name = 'Owner') OR
      (user_record.role = 'MANAGER' AND r.name = 'Manager') OR
      (user_record.role = 'FRONT_DESK' AND r.name = 'Front Desk') OR
      (user_record.role = 'HOUSEKEEPING' AND r.name = 'Housekeeping') OR
      (user_record.role = 'MAINTENANCE' AND r.name = 'Maintenance') OR
      (user_record.role = 'POS' AND r.name = 'Front Desk') -- Map POS to Front Desk
    );
    
    -- For global roles (super admin)
    IF user_record.role = 'SUPER_ADMIN' THEN
      SELECT r.id INTO role_record
      FROM public.roles r
      WHERE r.scope = 'global' AND r.name = 'Super Admin';
    END IF;
    
    -- Update the user with the new role
    IF role_record IS NOT NULL THEN
      UPDATE public.users 
      SET role_id = role_record
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;