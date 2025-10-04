import { lazy, ComponentType } from 'react';
import { UserRole } from '@/config/dashboardConfig';
import { getAllModulesForRole, getRoleConfig } from '@/lib/roleUtils';

/**
 * Enhanced Module Registry with lazy loading
 * Centralizes all role-based modules for dynamic loading
 */

export interface ModuleComponent {
  default: ComponentType<any>;
}

// Owner modules
export const ownerModules = {
  'dashboard': lazy(() => import('@/pages/owner/Dashboard')),
  'configuration': lazy(() => import('@/pages/owner/Configuration')),
  'staff': lazy(() => import('@/pages/owner/StaffRoles')),
  'financials': lazy(() => import('@/pages/owner/Financials')),
  'billing': lazy(() => import('@/pages/owner/EnhancedBilling')),
  'qr-manager': lazy(() => import('@/pages/owner/QRManager')),
  'qr-settings': lazy(() => import('@/pages/owner/QRSettings')),
  'qr-analytics': lazy(() => import('@/pages/owner/QRAnalytics')),
  'reports': lazy(() => import('@/pages/owner/Reports')),
  'reservations': lazy(() => import('@/pages/owner/Reservations')),
  'guests': lazy(() => import('@/pages/owner/Guests')),
  'rooms': lazy(() => import('@/pages/owner/Rooms')),
  'utilities': lazy(() => import('@/pages/owner/Utilities')),
  'housekeeping': lazy(() => import('@/pages/owner/Housekeeping')),
  'sms': lazy(() => import('@/pages/hotel/SMSCenter')),
  'monitoring': lazy(() => import('@/pages/owner/Monitoring')),
};

// Manager modules
export const managerModules = {
  'dashboard': lazy(() => import('@/pages/manager/Dashboard')),
  'operations': lazy(() => import('@/pages/manager/Operations')),
  'approvals': lazy(() => import('@/pages/manager/Approvals')),
  'rooms': lazy(() => import('@/pages/manager/RoomStatus')),
  'requests': lazy(() => import('@/pages/manager/ServiceRequests')),
  'staff': lazy(() => import('@/pages/manager/StaffManagement')),
  'qr-codes': lazy(() => import('@/pages/manager/QRManagement')),
  'financials': lazy(() => import('@/pages/manager/DepartmentFinance')),
  'receipts': lazy(() => import('@/pages/manager/ReceiptControl')),
  'events': lazy(() => import('@/pages/manager/EventsPackages')),
  'compliance': lazy(() => import('@/pages/manager/Compliance')),
  'sms': lazy(() => import('@/pages/hotel/SMSCenter')),
};

// Accountant modules
export const accountantModules = {
  'dashboard': lazy(() => import('@/pages/accountant/Dashboard')),
  'payments': lazy(() => import('@/pages/accountant/Payments')),
  'reports': lazy(() => import('@/pages/accountant/Reports')),
  'payroll': lazy(() => import('@/pages/accountant/Payroll')),
};

// Housekeeping modules
export const housekeepingModules = {
  'dashboard': lazy(() => import('@/pages/housekeeping/Dashboard')),
  'tasks': lazy(() => import('@/pages/housekeeping/Tasks')),
  'amenities': lazy(() => import('@/pages/housekeeping/Amenities')),
  'supplies': lazy(() => import('@/pages/housekeeping/Supplies')),
  'oos-rooms': lazy(() => import('@/pages/housekeeping/OOSRooms')),
  'staff': lazy(() => import('@/pages/housekeeping/StaffAssignments')),
  'audit': lazy(() => import('@/pages/housekeeping/AuditLogs')),
};

// Maintenance modules
export const maintenanceModules = {
  'dashboard': lazy(() => import('@/pages/maintenance/Dashboard')),
  'work-orders': lazy(() => import('@/pages/maintenance/WorkOrders')),
  'preventive': lazy(() => import('@/pages/maintenance/Preventive')),
  'supplies': lazy(() => import('@/pages/maintenance/Supplies')),
  'audit': lazy(() => import('@/pages/maintenance/Audit')),
};

// POS modules
export const posModules = {
  'dashboard': lazy(() => import('@/pages/pos/Dashboard')),
  'kds': lazy(() => import('@/pages/pos/KDS')),
  'menu': lazy(() => import('@/pages/pos/Menu')),
  'payment': lazy(() => import('@/pages/pos/Payment')),
  'approvals': lazy(() => import('@/pages/pos/Approvals')),
  'reports': lazy(() => import('@/pages/pos/Reports')),
  'settings': lazy(() => import('@/pages/pos/Settings')),
};

/**
 * Central module registry - maps role to module components
 */
export const moduleRegistry: Record<string, Record<string, ReturnType<typeof lazy>>> = {
  OWNER: ownerModules,
  MANAGER: managerModules,
  ACCOUNTANT: accountantModules,
  HOUSEKEEPING: housekeepingModules,
  MAINTENANCE: maintenanceModules,
  POS: posModules,
};

/**
 * Find which role in the inheritance chain provides a specific module
 */
const findModuleSourceRole = (
  role: UserRole,
  moduleName: string
): UserRole | null => {
  // Check if current role has the module directly
  if (moduleRegistry[role]?.[moduleName]) {
    return role;
  }

  // Check inherited roles
  const roleConfig = getRoleConfig(role);
  if (!roleConfig?.inherits) return null;

  for (const inheritedRole of roleConfig.inherits) {
    const sourceRole = findModuleSourceRole(inheritedRole as UserRole, moduleName);
    if (sourceRole) return sourceRole;
  }

  return null;
};

/**
 * Get module component for a specific role and module name
 * Searches through role inheritance chain to find the module
 */
export const getModuleComponent = (
  role: UserRole,
  moduleName: string
): ReturnType<typeof lazy> | null => {
  // Find which role provides this module (including inherited roles)
  const sourceRole = findModuleSourceRole(role, moduleName);
  
  if (!sourceRole) return null;
  
  const roleModules = moduleRegistry[sourceRole];
  return roleModules?.[moduleName] || null;
};

/**
 * Check if a module exists for a role
 */
export const moduleExists = (role: UserRole, moduleName: string): boolean => {
  return !!getModuleComponent(role, moduleName);
};

/**
 * Get all available module keys for a role
 */
export const getAvailableModuleKeys = (role: UserRole): string[] => {
  const roleModules = moduleRegistry[role];
  return Object.keys(roleModules || {});
};

/**
 * Generate module key from role and module name
 */
export const getModuleKey = (role: string, moduleName: string): string => {
  return `${role.toLowerCase()}.${moduleName}`;
};
