-- Create hotel-specific tenant role templates
INSERT INTO public.roles (name, description, scope, tenant_id, is_system) VALUES
  ('HOTEL_OWNER', 'Full hotel control (branding, staff, pricing, subscriptions)', 'tenant', NULL, true),
  ('HOTEL_MANAGER', 'Ops (rates, availability, reservations, rosters), reports', 'tenant', NULL, true),
  ('FRONT_DESK', 'Check-in/out, reservations, folios, payments, receipts. Offline-enabled', 'tenant', NULL, true),
  ('HOUSEKEEPING', 'Room status, tasks, checklists, supply usage', 'tenant', NULL, true),
  ('MAINTENANCE', 'Work orders, asset logs, generator runtime', 'tenant', NULL, true),
  ('POS_STAFF', 'F&B orders, post to room folio (Phase 2 for POS depth)', 'tenant', NULL, true),
  ('ACCOUNTANT', 'Ledgers, reconciliation, refunds, exports', 'tenant', NULL, true),
  ('SECURITY', 'Visitor logs, incidents (optional guard tours)', 'tenant', NULL, true),
  ('EVENT_MANAGER', 'Halls, packages, bookings, invoices', 'tenant', NULL, true),
  ('MARKETING', 'Campaigns (email now; WA/SMS later)', 'tenant', NULL, true),
  ('IT_ADMIN', 'Devices, network, kiosk (Optional)', 'tenant', NULL, true);

-- Get the role IDs for permission assignment
DO $$
DECLARE
  hotel_owner_id UUID;
  hotel_manager_id UUID;
  front_desk_id UUID;
  housekeeping_id UUID;
  maintenance_id UUID;
  pos_staff_id UUID;
  accountant_id UUID;
  security_id UUID;
  event_manager_id UUID;
  marketing_id UUID;
  it_admin_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO hotel_owner_id FROM public.roles WHERE name = 'HOTEL_OWNER' AND tenant_id IS NULL;
  SELECT id INTO hotel_manager_id FROM public.roles WHERE name = 'HOTEL_MANAGER' AND tenant_id IS NULL;
  SELECT id INTO front_desk_id FROM public.roles WHERE name = 'FRONT_DESK' AND tenant_id IS NULL;
  SELECT id INTO housekeeping_id FROM public.roles WHERE name = 'HOUSEKEEPING' AND tenant_id IS NULL;
  SELECT id INTO maintenance_id FROM public.roles WHERE name = 'MAINTENANCE' AND tenant_id IS NULL;
  SELECT id INTO pos_staff_id FROM public.roles WHERE name = 'POS_STAFF' AND tenant_id IS NULL;
  SELECT id INTO accountant_id FROM public.roles WHERE name = 'ACCOUNTANT' AND tenant_id IS NULL;
  SELECT id INTO security_id FROM public.roles WHERE name = 'SECURITY' AND tenant_id IS NULL;
  SELECT id INTO event_manager_id FROM public.roles WHERE name = 'EVENT_MANAGER' AND tenant_id IS NULL;
  SELECT id INTO marketing_id FROM public.roles WHERE name = 'MARKETING' AND tenant_id IS NULL;
  SELECT id INTO it_admin_id FROM public.roles WHERE name = 'IT_ADMIN' AND tenant_id IS NULL;

  -- HOTEL_OWNER: All tenant permissions (full control)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT hotel_owner_id, p.id
  FROM public.permissions p
  WHERE p.module IN ('dashboard', 'reservations', 'billing', 'rooms', 'staff', 'housekeeping', 'maintenance', 'reports', 'settings');

  -- HOTEL_MANAGER: Operations and management permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT hotel_manager_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'reservations.read', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
    'billing.read', 'billing.write',
    'rooms.read', 'rooms.write', 'rooms.manage',
    'staff.read', 'staff.write',
    'housekeeping.read',
    'maintenance.read',
    'reports.read', 'reports.export',
    'settings.read'
  );

  -- FRONT_DESK: Guest services and reservations
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT front_desk_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'reservations.read', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
    'billing.read', 'billing.write',
    'rooms.read'
  );

  -- HOUSEKEEPING: Room maintenance and cleaning
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT housekeeping_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'rooms.read', 'rooms.write',
    'housekeeping.read', 'housekeeping.write', 'housekeeping.manage'
  );

  -- MAINTENANCE: Facility maintenance and repairs
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT maintenance_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'rooms.read', 'rooms.write',
    'maintenance.read', 'maintenance.write', 'maintenance.manage'
  );

  -- POS_STAFF: F&B orders and folio posting
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT pos_staff_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'billing.read', 'billing.write',
    'rooms.read'
  );

  -- ACCOUNTANT: Financial management
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT accountant_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'billing.read', 'billing.write', 'billing.approve', 'billing.delete',
    'reports.read', 'reports.export'
  );

  -- SECURITY: Basic access for security operations
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT security_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'rooms.read'
  );

  -- EVENT_MANAGER: Event and booking management
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT event_manager_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'reservations.read', 'reservations.write',
    'billing.read', 'billing.write',
    'rooms.read',
    'reports.read'
  );

  -- MARKETING: Campaign management
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT marketing_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'reports.read'
  );

  -- IT_ADMIN: System administration
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT it_admin_id, p.id
  FROM public.permissions p
  WHERE p.name IN (
    'dashboard.read',
    'settings.read', 'settings.write',
    'system.read', 'system.manage'
  );

END $$;