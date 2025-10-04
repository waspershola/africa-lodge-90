import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { ReactNode } from 'react';

interface RouteProtectionProps {
  children: ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
}

export function RouteProtection({ 
  children, 
  requiredRole, 
  allowedRoles 
}: RouteProtectionProps) {
  const { user, isLoading, hasAccess } = useAuth();
  const location = useLocation();

  // Still loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && !hasAccess(requiredRole)) {
    // Redirect based on user's actual role
    const redirectPath = getUserDashboardPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  // Check allowed roles array
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => hasAccess(role));
    if (!hasAllowedRole) {
      const redirectPath = getUserDashboardPath(user.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}

// Helper function to get default dashboard path for each role
function getUserDashboardPath(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/sa/dashboard';
    case 'PLATFORM_ADMIN':
    case 'SUPPORT_ADMIN':
    case 'Support Admin':
      return '/support-admin/dashboard';
    case 'SUPPORT_STAFF':
    case 'Support Staff':
      return '/support-staff/dashboard';
    case 'FRONT_DESK':
      return '/front-desk';
    // All staff roles use unified dashboard
    case 'OWNER':
    case 'MANAGER':
    case 'ACCOUNTANT':
    case 'HOUSEKEEPING':
    case 'MAINTENANCE':
    case 'POS':
      return '/dashboard';
    default:
      // For unknown roles, check if it's a global role
      if (['PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'SUPPORT_STAFF', 'Support Admin', 'Platform Admin', 'Support Staff'].includes(role)) {
        return '/support-admin/dashboard';
      }
      return '/dashboard';
  }
}