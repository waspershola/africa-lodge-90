import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { useAuth, UserRole } from '@/hooks/useMultiTenantAuth';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
  fallback?: ReactNode;
  showMessage?: boolean;
}

export default function RoleGuard({ 
  children, 
  requiredRole, 
  requiredPermission, 
  fallback,
  showMessage = true 
}: RoleGuardProps) {
  const { user, hasAccess, hasPermission } = useAuth();

  // Check role access
  const hasRoleAccess = requiredRole ? hasAccess(Array.isArray(requiredRole) ? requiredRole[0] : requiredRole) : true;
  
  // Check permission access
  const hasPermissionAccess = requiredPermission ? 
    (Array.isArray(requiredPermission) ? 
      requiredPermission.some(p => hasPermission(p)) : 
      hasPermission(requiredPermission)
    ) : true;

  const hasAccessToFeature = hasRoleAccess && hasPermissionAccess;

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access this feature.</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccessToFeature) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showMessage) {
      return null;
    }

    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Access Restricted</strong>
              <p className="text-sm mt-1">
                This feature requires {
                  requiredRole ? 
                    `${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role` :
                    'additional permissions'
                }. Contact your manager for access.
              </p>
            </div>
            <Lock className="h-8 w-8 text-orange-500" />
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Higher-order component for role-based UI elements
interface ProtectedButtonProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
}

export function ProtectedButton({ 
  children, 
  requiredRole, 
  requiredPermission, 
  onClick, 
  ...buttonProps 
}: ProtectedButtonProps) {
  const { hasAccess, hasPermission } = useAuth();

  const hasRoleAccess = requiredRole ? hasAccess(Array.isArray(requiredRole) ? requiredRole[0] : requiredRole) : true;
  const hasPermissionAccess = requiredPermission ? hasPermission(requiredPermission) : true;
  const hasAccessToFeature = hasRoleAccess && hasPermissionAccess;

  if (!hasAccessToFeature) {
    return null;
  }

  return (
    <Button onClick={onClick} {...buttonProps}>
      {children}
    </Button>
  );
}

// Component for showing user role and permissions
export function UserRoleDisplay() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Shield className="h-4 w-4 text-blue-500" />
      <span className="font-medium">{user.name}</span>
      <span className="text-muted-foreground">({user.role})</span>
    </div>
  );
}