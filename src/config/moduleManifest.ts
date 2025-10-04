import { lazy, ComponentType } from 'react';
import { UserRole } from './dashboardConfig';

/**
 * Module manifest - maps module names to their component paths
 * Supports lazy loading and role-based access control
 */

export interface ModuleMetadata {
  title: string;
  description?: string;
  requiredRole?: UserRole[];
  requiredPermission?: string;
}

export interface ModuleDefinition {
  component: () => Promise<{ default: ComponentType<any> }>;
  metadata: ModuleMetadata;
}

// Owner modules
const ownerModules: Record<string, ModuleDefinition> = {
  dashboard: {
    component: () => import('@/pages/owner/Dashboard'),
    metadata: { title: 'Dashboard', requiredRole: ['OWNER' as UserRole] }
  },
  configuration: {
    component: () => import('@/pages/owner/Configuration'),
    metadata: { title: 'Hotel Configuration', requiredRole: ['OWNER' as UserRole] }
  },
  reservations: {
    component: () => import('@/pages/owner/Reservations'),
    metadata: { title: 'Reservations', requiredRole: ['OWNER' as UserRole] }
  },
  rooms: {
    component: () => import('@/pages/owner/Rooms'),
    metadata: { title: 'Rooms & Rates', requiredRole: ['OWNER' as UserRole] }
  },
  guests: {
    component: () => import('@/pages/owner/Guests'),
    metadata: { title: 'Guests', requiredRole: ['OWNER' as UserRole] }
  },
  housekeeping: {
    component: () => import('@/pages/owner/Housekeeping'),
    metadata: { title: 'Housekeeping', requiredRole: ['OWNER' as UserRole] }
  },
  billing: {
    component: () => import('@/pages/owner/Billing'),
    metadata: { title: 'Billing & Payments', requiredRole: ['OWNER' as UserRole] }
  },
  'qr-manager': {
    component: () => import('@/pages/owner/QRManager'),
    metadata: { title: 'QR Manager', requiredRole: ['OWNER' as UserRole] }
  },
  'qr-analytics': {
    component: () => import('@/pages/owner/QRAnalytics'),
    metadata: { title: 'QR Analytics', requiredRole: ['OWNER' as UserRole] }
  },
  sms: {
    component: () => import('@/pages/hotel/SMSCenter'),
    metadata: { title: 'SMS Center', requiredRole: ['OWNER' as UserRole, 'MANAGER' as UserRole] }
  },
  reports: {
    component: () => import('@/components/ReportsInterface'),
    metadata: { title: 'Reports', requiredRole: ['OWNER' as UserRole] }
  },
  staff: {
    component: () => import('@/pages/owner/StaffRoles'),
    metadata: { title: 'Staff & Roles', requiredRole: ['OWNER' as UserRole] }
  },
  financials: {
    component: () => import('@/pages/owner/Financials'),
    metadata: { title: 'Financials', requiredRole: ['OWNER' as UserRole] }
  },
  utilities: {
    component: () => import('@/pages/owner/Utilities'),
    metadata: { title: 'Power & Fuel', requiredRole: ['OWNER' as UserRole] }
  },
  profile: {
    component: () => import('@/pages/owner/Configuration'),
    metadata: { title: 'Profile Settings', requiredRole: ['OWNER' as UserRole] }
  }
};

// Manager modules
const managerModules: Record<string, ModuleDefinition> = {
  dashboard: {
    component: () => import('@/pages/manager/Dashboard'),
    metadata: { title: 'Overview', requiredRole: ['MANAGER' as UserRole] }
  },
  operations: {
    component: () => import('@/pages/manager/Operations'),
    metadata: { title: 'Operations', requiredRole: ['MANAGER' as UserRole] }
  },
  approvals: {
    component: () => import('@/pages/manager/Approvals'),
    metadata: { title: 'Approvals', requiredRole: ['MANAGER' as UserRole] }
  },
  rooms: {
    component: () => import('@/pages/manager/RoomStatus'),
    metadata: { title: 'Room Status', requiredRole: ['MANAGER' as UserRole] }
  },
  requests: {
    component: () => import('@/pages/manager/ServiceRequests'),
    metadata: { title: 'Service Requests', requiredRole: ['MANAGER' as UserRole] }
  },
  staff: {
    component: () => import('@/pages/manager/Dashboard'),
    metadata: { title: 'Staff Management', requiredRole: ['MANAGER' as UserRole] }
  },
  'qr-codes': {
    component: () => import('@/pages/manager/Dashboard'),
    metadata: { title: 'QR Management', requiredRole: ['MANAGER' as UserRole] }
  },
  sms: {
    component: () => import('@/pages/hotel/SMSCenter'),
    metadata: { title: 'SMS Center', requiredRole: ['OWNER' as UserRole, 'MANAGER' as UserRole] }
  },
  financials: {
    component: () => import('@/pages/manager/DepartmentFinance'),
    metadata: { title: 'Department Finance', requiredRole: ['MANAGER' as UserRole] }
  },
  receipts: {
    component: () => import('@/pages/manager/ReceiptControl'),
    metadata: { title: 'Receipt Control', requiredRole: ['MANAGER' as UserRole] }
  },
  events: {
    component: () => import('@/pages/manager/EventsPackages'),
    metadata: { title: 'Events & Packages', requiredRole: ['MANAGER' as UserRole] }
  },
  compliance: {
    component: () => import('@/pages/manager/Compliance'),
    metadata: { title: 'Compliance', requiredRole: ['MANAGER' as UserRole] }
  }
};

// Housekeeping modules
const housekeepingModules: Record<string, ModuleDefinition> = {
  dashboard: {
    component: () => import('@/pages/housekeeping/Dashboard'),
    metadata: { title: 'Dashboard', requiredRole: ['HOUSEKEEPING' as UserRole] }
  },
  tasks: {
    component: () => import('@/pages/housekeeping/Tasks'),
    metadata: { title: 'Tasks Board', requiredRole: ['HOUSEKEEPING' as UserRole] }
  },
  amenities: {
    component: () => import('@/pages/housekeeping/Amenities'),
    metadata: { title: 'Amenity Requests', requiredRole: ['HOUSEKEEPING' as UserRole] }
  },
  supplies: {
    component: () => import('@/pages/housekeeping/Supplies'),
    metadata: { title: 'Supplies', requiredRole: ['HOUSEKEEPING' as UserRole] }
  },
  'oos-rooms': {
    component: () => import('@/pages/housekeeping/OOSRooms'),
    metadata: { title: 'OOS Rooms', requiredRole: ['HOUSEKEEPING' as UserRole] }
  },
  staff: {
    component: () => import('@/pages/housekeeping/Dashboard'),
    metadata: { title: 'Staff Assignments', requiredRole: ['HOUSEKEEPING' as UserRole] }
  },
  audit: {
    component: () => import('@/pages/housekeeping/Dashboard'),
    metadata: { title: 'Audit Logs', requiredRole: ['HOUSEKEEPING' as UserRole] }
  }
};

// Maintenance modules
const maintenanceModules: Record<string, ModuleDefinition> = {
  dashboard: {
    component: () => import('@/pages/maintenance/Dashboard'),
    metadata: { title: 'Dashboard', requiredRole: ['MAINTENANCE' as UserRole] }
  },
  'work-orders': {
    component: () => import('@/pages/maintenance/WorkOrders'),
    metadata: { title: 'Work Orders', requiredRole: ['MAINTENANCE' as UserRole] }
  },
  preventive: {
    component: () => import('@/pages/maintenance/Preventive'),
    metadata: { title: 'Preventive Schedule', requiredRole: ['MAINTENANCE' as UserRole] }
  },
  supplies: {
    component: () => import('@/pages/maintenance/Supplies'),
    metadata: { title: 'Supplies & Parts', requiredRole: ['MAINTENANCE' as UserRole] }
  },
  audit: {
    component: () => import('@/pages/maintenance/Audit'),
    metadata: { title: 'Audit Logs', requiredRole: ['MAINTENANCE' as UserRole] }
  }
};

// POS modules
const posModules: Record<string, ModuleDefinition> = {
  dashboard: {
    component: () => import('@/pages/pos/Dashboard'),
    metadata: { title: 'Live Orders', requiredRole: ['POS' as UserRole] }
  },
  kds: {
    component: () => import('@/pages/pos/KDS'),
    metadata: { title: 'Kitchen Display', requiredRole: ['POS' as UserRole] }
  },
  menu: {
    component: () => import('@/pages/pos/Menu'),
    metadata: { title: 'Menu Management', requiredRole: ['POS' as UserRole] }
  },
  payment: {
    component: () => import('@/pages/pos/Payment'),
    metadata: { title: 'Payment & Billing', requiredRole: ['POS' as UserRole] }
  },
  approvals: {
    component: () => import('@/pages/pos/Approvals'),
    metadata: { title: 'Approvals', requiredRole: ['POS' as UserRole] }
  },
  reports: {
    component: () => import('@/pages/pos/Reports'),
    metadata: { title: 'Reports', requiredRole: ['POS' as UserRole] }
  },
  settings: {
    component: () => import('@/pages/pos/Settings'),
    metadata: { title: 'Settings', requiredRole: ['POS' as UserRole] }
  }
};

/**
 * Main module registry - maps role and module name to component
 */
export const MODULE_REGISTRY: Record<UserRole, Record<string, ModuleDefinition>> = {
  OWNER: ownerModules,
  MANAGER: managerModules,
  HOUSEKEEPING: housekeepingModules,
  MAINTENANCE: maintenanceModules,
  POS: posModules,
  FRONT_DESK: {}, // Front desk has separate routing
  SUPER_ADMIN: {} // Super admin has separate routing
};

/**
 * Get module definition for a specific role and module name
 */
export const getModuleDefinition = (
  role: UserRole,
  moduleName: string
): ModuleDefinition | null => {
  const roleModules = MODULE_REGISTRY[role];
  return roleModules?.[moduleName] || null;
};

/**
 * Check if a module exists for a role
 */
export const moduleExists = (role: UserRole, moduleName: string): boolean => {
  return !!getModuleDefinition(role, moduleName);
};

/**
 * Get all available modules for a role
 */
export const getAvailableModules = (role: UserRole): string[] => {
  const roleModules = MODULE_REGISTRY[role];
  return Object.keys(roleModules || {});
};
