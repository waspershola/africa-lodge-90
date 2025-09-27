import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CreditCard, 
  Clock, 
  Ban,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface SubscriptionStatusHandlerProps {
  children: React.ReactNode;
}

export function SubscriptionStatusHandler({ children }: SubscriptionStatusHandlerProps) {
  const { user, tenant, trialStatus, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle subscription expiry
  useEffect(() => {
    if (tenant?.subscription_status === 'expired' && location.pathname !== '/billing') {
      // Redirect to billing page for expired subscriptions
      navigate('/owner-dashboard/billing');
    }
  }, [tenant?.subscription_status, location.pathname, navigate]);

  // Don't render status handlers on billing page
  if (location.pathname.includes('/billing')) {
    return <>{children}</>;
  }

  // Handle suspended tenant
  if (tenant?.subscription_status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-4">
              <Ban className="h-8 w-8 text-danger" />
            </div>
            <CardTitle className="text-danger">Account Suspended</CardTitle>
            <CardDescription>
              Your hotel's account has been temporarily suspended.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please contact support to resolve this issue and restore access to your account.
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full"
                onClick={() => window.open('mailto:support@luxuryhotelpro.com')}
              >
                Contact Support
              </Button>
              <Button variant="outline" className="w-full" onClick={logout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle expired subscription
  if (tenant?.subscription_status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-warning">Subscription Expired</CardTitle>
            <CardDescription>
              Your {tenant.hotel_name} subscription has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your access has been suspended. Renew your subscription to continue 
                using all features and restore full access to your hotel management system.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-primary"
                onClick={() => navigate('/owner-dashboard/billing')}
              >
                <Zap className="mr-2 h-4 w-4" />
                Renew Subscription
              </Button>
              <Button variant="outline" className="w-full" onClick={logout}>
                Logout
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Need help? <a href="mailto:support@luxuryhotelpro.com" className="text-primary hover:underline">Contact Support</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle trial expiry warning (show banner for the last 3 days)
  if (
    tenant?.subscription_status === 'trialing' && 
    trialStatus?.daysRemaining !== null &&
    trialStatus?.daysRemaining <= 3 &&
    trialStatus?.daysRemaining > 0
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Trial Warning Banner */}
        <div className="bg-gradient-to-r from-warning/20 to-warning/10 border-b border-warning/30">
          <div className="container mx-auto px-4 py-4">
            <Alert className="border-warning/30 bg-transparent">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <AlertDescription className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-warning font-medium">
                    <strong>Trial Expiring Soon!</strong> Only {trialStatus.daysRemaining} days remaining.
                  </p>
                  <Progress 
                    value={((14 - trialStatus.daysRemaining) / 14) * 100} 
                    className="w-64 h-2"
                  />
                </div>
                <Button 
                  className="bg-warning hover:bg-warning/90 text-warning-foreground ml-4"
                  onClick={() => navigate('/owner-dashboard/billing')}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    );
  }

  // Handle trial ended (day 0)
  if (
    tenant?.subscription_status === 'trialing' && 
    trialStatus?.daysRemaining === 0
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-warning">Trial Period Ended</CardTitle>
            <CardDescription>
              Your 14-day free trial for {tenant.hotel_name} has ended.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm">
                Thank you for trying our hotel management platform! 
              </p>
              <p className="text-sm text-muted-foreground">
                Upgrade now to continue managing your hotel operations seamlessly.
              </p>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>What you get:</strong> Full access to all features, unlimited rooms, 
                24/7 support, and advanced analytics.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-primary"
                onClick={() => navigate('/owner-dashboard/billing')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Choose Your Plan
              </Button>
              <Button variant="outline" className="w-full" onClick={logout}>
                Maybe Later
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Questions? <a href="mailto:sales@luxuryhotelpro.com" className="text-primary hover:underline">Talk to Sales</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: render children normally
  return <>{children}</>;
}