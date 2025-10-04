import { useMemo } from 'react';
import { UserRole } from '@/config/dashboardConfig';
import menuConfig from '@/config/menuConfig.json';

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  component: string;
  icon: string;
}

export interface RoleConfig {
  title: string;
  icon: string;
  inherits: string[];
  modules: MenuItem[];
}

/**
 * Resolve inherited modules for a role using depth-first traversal
 * Handles circular dependencies and deduplication
 */
function resolveInheritedModules(
  roleName: string,
  config: Record<string, RoleConfig>,
  visited: Set<string> = new Set()
): MenuItem[] {
  // Prevent circular dependencies
  if (!config[roleName] || visited.has(roleName)) {
    return [];
  }
  
  visited.add(roleName);
  const role = config[roleName];
  
  // Recursively resolve inherited modules
  const inheritedModules = (role.inherits || [])
    .flatMap(inheritedRole => resolveInheritedModules(inheritedRole, config, new Set(visited)));
  
  // Combine inherited and own modules
  const allModules = [...inheritedModules, ...(role.modules || [])];
  
  // Deduplicate by module id (later entries override earlier ones)
  const moduleMap = new Map<string, MenuItem>();
  allModules.forEach(module => {
    moduleMap.set(module.id, module);
  });
  
  return Array.from(moduleMap.values());
}

/**
 * Hook to load menu configuration with inheritance support
 * @param role - User role to load menu for
 * @returns Resolved menu items with all inherited modules
 */
export function useMenuLoader(role: UserRole | undefined) {
  const resolvedModules = useMemo(() => {
    if (!role) return [];
    
    const config = menuConfig.roles as Record<string, RoleConfig>;
    
    // Check if role exists in config
    if (!config[role]) {
      console.warn(`No menu configuration found for role: ${role}`);
      return [];
    }
    
    return resolveInheritedModules(role, config);
  }, [role]);

  const roleConfig = useMemo(() => {
    if (!role) return null;
    return (menuConfig.roles as Record<string, RoleConfig>)[role] || null;
  }, [role]);

  return {
    modules: resolvedModules,
    roleConfig,
    moduleCount: resolvedModules.length
  };
}

/**
 * Get all available role names from config
 */
export function getAvailableRoles(): UserRole[] {
  return Object.keys(menuConfig.roles) as UserRole[];
}

/**
 * Get role configuration without inheritance resolution
 */
export function getRoleConfig(role: UserRole): RoleConfig | null {
  return (menuConfig.roles as Record<string, RoleConfig>)[role] || null;
}

/**
 * Validate menu configuration integrity
 * Checks for circular dependencies and missing roles
 */
export function validateMenuConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const config = menuConfig.roles as Record<string, RoleConfig>;
  
  // Check each role's inheritance chain
  Object.entries(config).forEach(([roleName, roleConfig]) => {
    const visited = new Set<string>();
    const checkCircular = (currentRole: string): boolean => {
      if (visited.has(currentRole)) {
        errors.push(`Circular dependency detected in role: ${roleName} -> ${currentRole}`);
        return true;
      }
      visited.add(currentRole);
      
      const current = config[currentRole];
      if (!current) {
        errors.push(`Role ${roleName} inherits from non-existent role: ${currentRole}`);
        return false;
      }
      
      return (current.inherits || []).some(inherited => checkCircular(inherited));
    };
    
    (roleConfig.inherits || []).forEach(inherited => {
      if (!config[inherited]) {
        errors.push(`Role ${roleName} inherits from non-existent role: ${inherited}`);
      } else {
        checkCircular(inherited);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
