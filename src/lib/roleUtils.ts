import { UserRole } from '@/config/dashboardConfig';
import menuConfigData from '@/config/menuConfig.json';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  component: string;
  icon: string;
}

interface RoleConfig {
  title: string;
  icon: string;
  modules: MenuItem[];
  inherits?: string[];
}

interface MenuConfig {
  roles: Record<string, RoleConfig>;
}

const menuConfig = menuConfigData as MenuConfig;

/**
 * Recursively resolve inherited modules with circular dependency protection
 * Returns all modules for a role including inherited ones
 */
export const resolveInheritedMenu = (
  role: string,
  config: MenuConfig = menuConfig,
  visited: Set<string> = new Set()
): { modules: MenuItem[] } => {
  // Prevent circular dependencies
  if (!config.roles[role] || visited.has(role)) {
    return { modules: [] };
  }

  visited.add(role);
  const roleConfig = config.roles[role];

  // Start with role's own modules
  let modules: MenuItem[] = [...(roleConfig.modules || [])];

  // Recursively add inherited modules
  const inherited = roleConfig.inherits || [];
  for (const parentRole of inherited) {
    const parentMenu = resolveInheritedMenu(parentRole, config, visited);
    modules = [...modules, ...parentMenu.modules];
  }

  // Deduplicate by module id (keep first occurrence)
  const uniqueModules = Array.from(
    new Map(modules.map(m => [m.id, m])).values()
  );

  return { modules: uniqueModules };
};

/**
 * Get role configuration from menuConfig.json
 */
export const getRoleConfig = (role: UserRole): RoleConfig | null => {
  return menuConfig.roles[role] || null;
};

/**
 * Get all modules for a role (including inherited)
 */
export const getAllModulesForRole = (role: UserRole): MenuItem[] => {
  const { modules } = resolveInheritedMenu(role);
  return modules;
};

/**
 * Get direct modules for a role (excluding inherited)
 */
export const getDirectModulesForRole = (role: UserRole): MenuItem[] => {
  const roleConfig = getRoleConfig(role);
  return roleConfig?.modules || [];
};

/**
 * Check if a role inherits from another role
 */
export const inheritsFrom = (role: UserRole, parentRole: string): boolean => {
  const roleConfig = getRoleConfig(role);
  if (!roleConfig || !roleConfig.inherits) return false;

  // Check direct inheritance
  if (roleConfig.inherits.includes(parentRole)) return true;

  // Check transitive inheritance
  for (const inherited of roleConfig.inherits) {
    if (inheritsFrom(inherited as UserRole, parentRole)) return true;
  }

  return false;
};

/**
 * Get inheritance tree for a role
 */
export const getInheritanceTree = (
  role: UserRole,
  depth: number = 0
): any => {
  if (depth > 10) return { error: 'Max depth exceeded' }; // Prevent infinite loops

  const roleConfig = getRoleConfig(role);
  if (!roleConfig) return null;

  return {
    role,
    title: roleConfig.title,
    moduleCount: getDirectModulesForRole(role).length,
    totalModules: getAllModulesForRole(role).length,
    inherits: roleConfig.inherits?.map(inherited =>
      getInheritanceTree(inherited as UserRole, depth + 1)
    ) || [],
  };
};

/**
 * Extract module name from path
 */
export const extractModuleFromPath = (path: string): string | null => {
  // Match patterns like /dashboard/module-name
  const match = path.match(/^\/dashboard\/([^\/]+)/);
  return match ? match[1] : null;
};

/**
 * Convert legacy route to unified route
 */
export const convertLegacyRoute = (legacyRoute: string): string => {
  const legacyMap: Record<string, string> = {
    '/owner-dashboard': '/dashboard',
    '/manager-dashboard': '/dashboard',
    '/accountant-dashboard': '/dashboard',
    '/housekeeping-dashboard': '/dashboard',
    '/maintenance-dashboard': '/dashboard',
    '/pos': '/dashboard',
  };

  for (const [legacy, unified] of Object.entries(legacyMap)) {
    if (legacyRoute.startsWith(legacy)) {
      return legacyRoute.replace(legacy, unified);
    }
  }

  return legacyRoute;
};
