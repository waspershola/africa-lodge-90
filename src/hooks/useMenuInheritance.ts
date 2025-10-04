import { useMemo } from 'react';
import { UserRole } from '@/config/dashboardConfig';
import { useMenuLoader } from './useMenuLoader';

/**
 * Hook to visualize role inheritance hierarchy
 * Useful for debugging and documentation
 */
export function useMenuInheritance(role: UserRole | undefined) {
  const { modules, roleConfig } = useMenuLoader(role);

  const inheritanceTree = useMemo(() => {
    if (!roleConfig) return null;

    const buildTree = (currentRole: string, depth: number = 0): any => {
      if (depth > 10) return { error: 'Max depth exceeded' }; // Prevent infinite loops
      
      return {
        role: currentRole,
        inherits: roleConfig.inherits?.map(inherited => buildTree(inherited, depth + 1)) || [],
        moduleCount: modules.length
      };
    };

    return buildTree(role || '');
  }, [role, roleConfig, modules.length]);

  return {
    inheritanceTree,
    totalModules: modules.length,
    directModules: roleConfig?.modules?.length || 0,
    inheritedModules: modules.length - (roleConfig?.modules?.length || 0)
  };
}

/**
 * Get module count by inheritance level
 */
export function getModuleCountBySource(role: UserRole): Record<string, number> {
  const { modules, roleConfig } = useMenuLoader(role);
  
  const counts: Record<string, number> = {
    [role]: roleConfig?.modules?.length || 0
  };

  // Calculate inherited counts
  const directModuleIds = new Set(roleConfig?.modules?.map(m => m.id) || []);
  const inheritedModules = modules.filter(m => !directModuleIds.has(m.id));
  
  counts['inherited'] = inheritedModules.length;

  return counts;
}
