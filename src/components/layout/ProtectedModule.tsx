import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { UserRole } from '@/config/dashboardConfig';
import { hasModuleAccess, getSafeRedirectPath } from '@/lib/accessControl';
import { getModuleComponent } from '@/modules/registry';
import { Loader2 } from 'lucide-react';

interface ProtectedModuleProps {
  moduleKey?: string;
  role?: UserRole;
}

/**
 * Loading fallback component for lazy-loaded modules
 */
const ModuleLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">Loading module...</p>
    </div>
  </div>
);

/**
 * Access denied component
 */
const AccessDenied = ({ role }: { role: UserRole }) => {
  const redirectPath = getSafeRedirectPath(role);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have permission to access this module.
          </p>
        </div>
        <Navigate to={redirectPath} replace />
      </div>
    </div>
  );
};

/**
 * Module not found component
 */
const ModuleNotFound = ({ role }: { role: UserRole }) => {
  const redirectPath = getSafeRedirectPath(role);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Module Not Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The requested module doesn't exist or is not available.
          </p>
        </div>
        <Navigate to={redirectPath} replace />
      </div>
    </div>
  );
};

/**
 * Protected Module Component
 * Handles access control, lazy loading, and error states for dynamic modules
 */
export default function ProtectedModule({ moduleKey, role: propRole }: ProtectedModuleProps) {
  const { user } = useAuth();
  const role = propRole || (user?.role as UserRole);

  // Validate role
  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  // Validate module key
  if (!moduleKey) {
    return <ModuleNotFound role={role} />;
  }

  // Check access permission
  if (!hasModuleAccess(role, moduleKey)) {
    return <AccessDenied role={role} />;
  }

  // Get module component from registry
  const ModuleComponent = getModuleComponent(role, moduleKey);

  // Module not found in registry
  if (!ModuleComponent) {
    return <ModuleNotFound role={role} />;
  }

  // Render module with Suspense boundary
  return (
    <Suspense fallback={<ModuleLoadingFallback />}>
      <ModuleComponent />
    </Suspense>
  );
}
