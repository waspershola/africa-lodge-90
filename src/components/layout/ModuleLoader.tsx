import { Suspense, lazy, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { UserRole } from '@/config/dashboardConfig';
import { getModuleDefinition, moduleExists } from '@/config/moduleManifest';
import { getDefaultRouteForRole } from '@/utils/roleRouter';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback component
 */
function ModuleLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading module...</p>
      </div>
    </div>
  );
}

/**
 * Error fallback when module not found
 */
function ModuleNotFound({ role, module }: { role: UserRole; module: string }) {
  const defaultRoute = getDefaultRouteForRole(role);
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Module Not Found</h2>
        <p className="text-muted-foreground">
          The module "{module}" does not exist or you don't have access to it.
        </p>
        <Navigate to={defaultRoute} replace />
      </div>
    </div>
  );
}

interface ModuleLoaderProps {
  role?: UserRole;
  moduleName?: string;
}

/**
 * Dynamic module loader component
 * Loads modules lazily based on role and module name
 */
export default function ModuleLoader({ 
  role: propRole, 
  moduleName: propModuleName 
}: ModuleLoaderProps) {
  const { user } = useAuth();
  const params = useParams();

  // Determine role and module name
  const role = propRole || (user?.role as UserRole);
  const moduleName = propModuleName || params.module;

  // Get module definition
  const moduleDefinition = useMemo(() => {
    if (!role || !moduleName) return null;
    return getModuleDefinition(role, moduleName);
  }, [role, moduleName]);

  // Lazy load the component
  const LazyComponent = useMemo(() => {
    if (!moduleDefinition) return null;
    return lazy(moduleDefinition.component);
  }, [moduleDefinition]);

  // Validation checks
  if (!role || !moduleName) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Invalid module configuration</p>
      </div>
    );
  }

  // Check if module exists for this role
  if (!moduleExists(role, moduleName)) {
    return <ModuleNotFound role={role} module={moduleName} />;
  }

  // Check role authorization
  const requiredRoles = moduleDefinition?.metadata.requiredRole;
  if (requiredRoles && !requiredRoles.includes(role)) {
    const defaultRoute = getDefaultRouteForRole(role);
    return <Navigate to={defaultRoute} replace />;
  }

  // Render the lazy-loaded component
  if (!LazyComponent) {
    return <ModuleNotFound role={role} module={moduleName} />;
  }

  return (
    <Suspense fallback={<ModuleLoadingFallback />}>
      <LazyComponent />
    </Suspense>
  );
}
