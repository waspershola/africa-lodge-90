import { UserRole } from '@/config/dashboardConfig';
import { resolveInheritedMenu, extractModuleFromPath, getRoleConfig } from './roleUtils';
import menuConfigData from '@/config/menuConfig.json';

interface MenuConfig {
  roles: Record<string, any>;
}

const menuConfig = menuConfigData as MenuConfig;

/**
 * Check if a user role has access to a specific module
 */
export const hasModuleAccess = (
  role: UserRole,
  moduleKey: string
): boolean => {
  const { modules } = resolveInheritedMenu(role, menuConfig);
  return modules.some(m => m.id === moduleKey);
};

/**
 * Get all accessible module keys for a role
 */
export const getAccessibleModules = (role: UserRole): string[] => {
  const { modules } = resolveInheritedMenu(role, menuConfig);
  return modules.map(m => m.id);
};

/**
 * Get all accessible module objects for a role (with full metadata)
 */
export const getAccessibleModuleObjects = (role: UserRole) => {
  const { modules } = resolveInheritedMenu(role, menuConfig);
  return modules;
};

/**
 * Validate route access for a role
 */
export const canAccessRoute = (
  role: UserRole,
  path: string
): boolean => {
  const moduleKey = extractModuleFromPath(path);
  if (!moduleKey) return false;
  return hasModuleAccess(role, moduleKey);
};

/**
 * Check if user has permission for a specific action
 * Can be extended with more granular permission checks
 */
export const hasPermission = (
  role: UserRole,
  permission: string
): boolean => {
  // Define role hierarchy for permission checks
  const roleHierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 100,
    OWNER: 90,
    MANAGER: 70,
    ACCOUNTANT: 50,
    POS: 40,
    HOUSEKEEPING: 30,
    MAINTENANCE: 30,
    FRONT_DESK: 20,
  };

  // Permission level requirements
  const permissionLevels: Record<string, number> = {
    'view:reports': 40,
    'manage:staff': 70,
    'manage:billing': 90,
    'manage:configuration': 90,
    'view:financials': 50,
    'manage:qr': 70,
  };

  const userLevel = roleHierarchy[role] || 0;
  const requiredLevel = permissionLevels[permission] || 100;

  return userLevel >= requiredLevel;
};

/**
 * Get safe redirect path for a role
 * Returns the first available module path
 */
export const getSafeRedirectPath = (role: UserRole): string => {
  const modules = getAccessibleModuleObjects(role);
  if (modules.length > 0) {
    return modules[0].path;
  }
  return '/dashboard'; // Fallback
};

/**
 * Check if a route is accessible for a specific user role
 */
export const isRouteAccessible = (
  role: UserRole,
  path: string
): boolean => {
  // Allow dashboard root for all authenticated users
  if (path === '/dashboard' || path === '/dashboard/') {
    return true;
  }

  return canAccessRoute(role, path);
};

/**
 * Get role title from config
 */
export const getRoleTitle = (role: UserRole): string => {
  const config = getRoleConfig(role);
  return config?.title || role;
};

/**
 * Validate if user has access to multiple modules
 */
export const hasAccessToModules = (
  role: UserRole,
  moduleKeys: string[]
): boolean => {
  return moduleKeys.every(key => hasModuleAccess(role, key));
};
