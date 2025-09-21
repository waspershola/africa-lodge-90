// Updated role and permission types for the comprehensive RBAC system

export type RoleScope = 'global' | 'tenant';

export interface Role {
  id: string;
  name: string;
  description?: string;
  scope: RoleScope;
  tenant_id?: string;
  is_system: boolean;
  permissions?: Permission[];
  staff_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

// Global Roles (Platform-Wide)
export type GlobalRoleType = 
  | 'Super Admin'
  | 'Platform Admin'
  | 'Support Staff';

// Tenant Roles (Per Hotel)
export type TenantRoleType = 
  | 'Owner'
  | 'Manager'
  | 'Front Desk'
  | 'Housekeeping'
  | 'Accounting'
  | 'Maintenance';

// Permission Modules
export type PermissionModule = 
  | 'dashboard'
  | 'reservations'
  | 'billing'
  | 'rooms'
  | 'staff'
  | 'housekeeping'
  | 'maintenance'
  | 'reports'
  | 'settings'
  | 'tenants'    // Global only
  | 'system';    // Global only

// Permission Actions
export type PermissionAction = 
  | 'read'
  | 'write'
  | 'delete'
  | 'manage'
  | 'approve'
  | 'checkin'
  | 'checkout'
  | 'invite'
  | 'export';

// Permission Matrix for UI
export interface PermissionMatrix {
  [module: string]: {
    [action: string]: boolean;
  };
}

// Role Creation/Update Data
export interface CreateRoleData {
  name: string;
  description?: string;
  scope: RoleScope;
  tenant_id?: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

// User with Role Information
export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: string; // Legacy role field
  role_id: string; // New role system
  tenant_id: string;
  is_active: boolean;
  permissions?: string[];
  role_info?: Role;
}

// Permission Check Helpers
export type PermissionCheck = {
  module: PermissionModule;
  action: PermissionAction;
};

// Predefined Permission Sets
export const GLOBAL_PERMISSIONS = {
  SUPER_ADMIN: [
    'tenants.read', 'tenants.write', 'tenants.delete',
    'system.manage', 'dashboard.read', 'reports.read', 'reports.export'
  ],
  PLATFORM_ADMIN: [
    'tenants.read', 'tenants.write',
    'system.manage', 'dashboard.read', 'reports.read', 'reports.export'
  ],
  SUPPORT_STAFF: [
    'tenants.read', 'dashboard.read', 'reservations.read', 
    'rooms.read', 'reports.read'
  ]
};

export const TENANT_PERMISSIONS = {
  OWNER: [
    'dashboard.read', 'reservations.read', 'reservations.write', 'reservations.delete',
    'reservations.checkin', 'reservations.checkout', 'billing.read', 'billing.write',
    'billing.approve', 'rooms.read', 'rooms.write', 'rooms.manage',
    'staff.read', 'staff.write', 'staff.invite', 'housekeeping.read',
    'housekeeping.write', 'maintenance.read', 'maintenance.write',
    'reports.read', 'reports.export', 'settings.read', 'settings.write'
  ],
  MANAGER: [
    'dashboard.read', 'reservations.read', 'reservations.write',
    'reservations.checkin', 'reservations.checkout', 'billing.read',
    'billing.write', 'rooms.read', 'rooms.write', 'staff.read',
    'housekeeping.read', 'housekeeping.write', 'maintenance.read',
    'maintenance.write', 'reports.read'
  ],
  FRONT_DESK: [
    'dashboard.read', 'reservations.read', 'reservations.write',
    'reservations.checkin', 'reservations.checkout', 'billing.read',
    'rooms.read'
  ],
  HOUSEKEEPING: [
    'rooms.read', 'rooms.write', 'housekeeping.read', 'housekeeping.write'
  ],
  ACCOUNTING: [
    'dashboard.read', 'billing.read', 'billing.write', 'billing.approve',
    'reports.read', 'reports.export'
  ],
  MAINTENANCE: [
    'rooms.read', 'rooms.write', 'maintenance.read', 'maintenance.write'
  ]
};