-- Create tenant role templates (not tied to specific tenants)
-- These serve as templates that will be copied when new tenants are created
INSERT INTO public.roles (name, description, scope, tenant_id, is_system) VALUES
('Owner', 'Full control over the hotel', 'tenant', NULL, true),
('Manager', 'Day-to-day operations management', 'tenant', NULL, true),
('Front Desk', 'Guest services and reservations', 'tenant', NULL, true),
('Housekeeping', 'Room maintenance and cleaning', 'tenant', NULL, true),
('Accounting', 'Financial management', 'tenant', NULL, true),
('Maintenance', 'Facility maintenance', 'tenant', NULL, true)
ON CONFLICT DO NOTHING;

-- Get the template role IDs and assign permissions
DO $$
DECLARE
  owner_template_id UUID;
  manager_template_id UUID;
  front_desk_template_id UUID;
  housekeeping_template_id UUID;
  accounting_template_id UUID;
  maintenance_template_id UUID;
BEGIN
  -- Get template role IDs (tenant_id IS NULL means they are templates)
  SELECT id INTO owner_template_id FROM public.roles 
  WHERE name = 'Owner' AND scope = 'tenant' AND tenant_id IS NULL;
  
  SELECT id INTO manager_template_id FROM public.roles 
  WHERE name = 'Manager' AND scope = 'tenant' AND tenant_id IS NULL;
  
  SELECT id INTO front_desk_template_id FROM public.roles 
  WHERE name = 'Front Desk' AND scope = 'tenant' AND tenant_id IS NULL;
  
  SELECT id INTO housekeeping_template_id FROM public.roles 
  WHERE name = 'Housekeeping' AND scope = 'tenant' AND tenant_id IS NULL;
  
  SELECT id INTO accounting_template_id FROM public.roles 
  WHERE name = 'Accounting' AND scope = 'tenant' AND tenant_id IS NULL;
  
  SELECT id INTO maintenance_template_id FROM public.roles 
  WHERE name = 'Maintenance' AND scope = 'tenant' AND tenant_id IS NULL;

  -- Assign permissions to Owner template (all tenant permissions)
  IF owner_template_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT owner_template_id, p.id
    FROM public.permissions p
    WHERE p.module IN ('dashboard', 'reservations', 'billing', 'rooms', 'staff', 'housekeeping', 'maintenance', 'reports', 'settings')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign permissions to Manager template
  IF manager_template_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT manager_template_id, p.id
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
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign permissions to Front Desk template
  IF front_desk_template_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT front_desk_template_id, p.id
    FROM public.permissions p
    WHERE p.name IN (
      'dashboard.read',
      'reservations.read', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
      'billing.read',
      'rooms.read'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign permissions to Housekeeping template
  IF housekeeping_template_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT housekeeping_template_id, p.id
    FROM public.permissions p
    WHERE p.name IN (
      'rooms.read', 'rooms.write',
      'housekeeping.read', 'housekeeping.write'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign permissions to Accounting template
  IF accounting_template_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT accounting_template_id, p.id
    FROM public.permissions p
    WHERE p.name IN (
      'dashboard.read',
      'billing.read', 'billing.write', 'billing.approve',
      'reports.read', 'reports.export'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign permissions to Maintenance template
  IF maintenance_template_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT maintenance_template_id, p.id
    FROM public.permissions p
    WHERE p.name IN (
      'rooms.read', 'rooms.write',
      'maintenance.read', 'maintenance.write'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;