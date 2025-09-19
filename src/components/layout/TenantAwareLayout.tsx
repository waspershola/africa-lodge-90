import { ReactNode } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';

interface TenantAwareLayoutProps {
  children: ReactNode;
  requiredRole?: 'OWNER' | 'MANAGER' | 'STAFF' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'POS';
}

export default function TenantAwareLayout({ children, requiredRole }: TenantAwareLayoutProps) {
  const { 
    user, 
    tenant, 
    isLoading, 
    hasAccess, 
    trialStatus,
    logout 
  } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login required
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please log in to access the dashboard.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show subscription expired
  if (tenant?.subscription_status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Subscription Expired</h2>
          <p className="text-muted-foreground mb-4">
            Your hotel's subscription has expired. Please renew to continue using the platform.
          </p>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => window.location.href = '/owner-dashboard/billing'}>
              Renew Subscription
            </Button>
            <Button variant="outline" className="w-full" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied
  if (requiredRole && !hasAccess(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="h-16 w-16 text-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this area. Required role: {requiredRole}
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show trial expiry warning for owners
  const showTrialWarning = user?.role === 'OWNER' && 
    tenant?.subscription_status === 'trialing' && 
    trialStatus?.daysRemaining && 
    trialStatus.daysRemaining <= 3;

  return (
    <>
      {showTrialWarning && (
        <div className="bg-warning/10 border-b border-warning/20">
          <div className="container mx-auto px-4 py-3">
            <Alert className="border-warning/20 bg-transparent">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                <strong>Trial expiring soon!</strong> Only {trialStatus?.daysRemaining} days remaining. 
                <Button 
                  variant="link" 
                  className="h-auto p-0 ml-2 text-warning underline"
                  onClick={() => window.location.href = '/owner-dashboard/billing'}
                >
                  Upgrade now
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      {children}
    </>
  );
}