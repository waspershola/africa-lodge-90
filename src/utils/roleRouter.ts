import { UserRole, getDashboardConfig, getDefaultRouteForRole, usesUnifiedDashboard } from '@/config/dashboardConfig';

/**
 * Role-based routing utilities for the unified dashboard shell
 */

// Map legacy routes to new unified routes
const LEGACY_ROUTE_MAP: Record<string, string> = {
  '/owner-dashboard': '/staff-dashboard',
  '/manager-dashboard': '/staff-dashboard',
  '/housekeeping-dashboard': '/staff-dashboard',
  '/maintenance-dashboard': '/staff-dashboard',
  '/pos': '/staff-dashboard',
};

/**
 * Convert a legacy route to the new unified route format
 * @param legacyRoute - The old route path
 * @returns The new unified route path
 */
export const convertLegacyRoute = (legacyRoute: string): string => {
  // Check if it's a direct match
  if (LEGACY_ROUTE_MAP[legacyRoute]) {
    return LEGACY_ROUTE_MAP[legacyRoute];
  }

  // Check if it's a nested route (e.g., /owner-dashboard/rooms)
  for (const [legacy, unified] of Object.entries(LEGACY_ROUTE_MAP)) {
    if (legacyRoute.startsWith(legacy + '/')) {
      const module = legacyRoute.replace(legacy + '/', '');
      return `${unified}/${module}`;
    }
  }

  // Return as-is if no mapping found
  return legacyRoute;
};

/**
 * Get the appropriate dashboard route for a user role
 * @param role - User role
 * @param module - Optional module to navigate to
 * @returns The dashboard route path
 */
export const getDashboardRoute = (role: UserRole, module?: string): string => {
  const config = getDashboardConfig(role);
  
  if (!config) {
    return '/';
  }

  // Handle roles that don't use unified dashboard
  if (!usesUnifiedDashboard(role)) {
    return config.defaultRoute;
  }

  // Build unified dashboard route
  if (module) {
    return `/staff-dashboard/${module}`;
  }

  return config.defaultRoute;
};

/**
 * Extract module name from a route path
 * @param path - Route path
 * @returns Module name or null
 */
export const extractModuleFromPath = (path: string): string | null => {
  // Handle legacy routes
  const legacyPatterns = [
    /\/owner-dashboard\/([^/]+)/,
    /\/manager-dashboard\/([^/]+)/,
    /\/housekeeping-dashboard\/([^/]+)/,
    /\/maintenance-dashboard\/([^/]+)/,
    /\/pos\/([^/]+)/,
  ];

  for (const pattern of legacyPatterns) {
    const match = path.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Handle unified dashboard routes
  const unifiedPattern = /\/staff-dashboard\/([^/]+)/;
  const match = path.match(unifiedPattern);
  
  return match ? match[1] : null;
};

/**
 * Check if a user has access to a specific module
 * @param role - User role
 * @param moduleName - Module to check access for
 * @returns Boolean indicating access permission
 */
export const hasModuleAccess = (role: UserRole, moduleName: string): boolean => {
  const config = getDashboardConfig(role);
  
  if (!config) {
    return false;
  }

  return config.navigation.some(nav => nav.module === moduleName);
};

/**
 * Get the base dashboard path for a role (without module)
 * @param role - User role
 * @returns Base dashboard path
 */
export const getBaseDashboardPath = (role: UserRole): string => {
  switch (role) {
    case 'OWNER':
      return '/owner-dashboard';
    case 'MANAGER':
      return '/manager-dashboard';
    case 'HOUSEKEEPING':
      return '/housekeeping-dashboard';
    case 'MAINTENANCE':
      return '/maintenance-dashboard';
    case 'POS':
      return '/pos';
    case 'FRONT_DESK':
      return '/front-desk';
    case 'SUPER_ADMIN':
      return '/sa';
    default:
      return '/';
  }
};

/**
 * Validate if a route is accessible for a given role
 * @param role - User role
 * @param path - Route path to validate
 * @returns Boolean indicating if route is accessible
 */
export const isRouteAccessible = (role: UserRole, path: string): boolean => {
  const config = getDashboardConfig(role);
  
  if (!config) {
    return false;
  }

  // Check if path matches any navigation item
  return config.navigation.some(nav => path.startsWith(nav.href));
};

/**
 * Export getDefaultRouteForRole for external use
 */
export { getDefaultRouteForRole } from '@/config/dashboardConfig';

/**
 * Get redirect path when user doesn't have access to current route
 * @param role - User role
 * @returns Safe redirect path
 */
export const getSafeRedirectPath = (role: UserRole): string => {
  return getDefaultRouteForRole(role);
};
