import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Shield, 
  Mail,
  Phone,
  Calendar,
  Building2,
  Key,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useStaffInvites } from '@/hooks/useStaffInvites';
import { RegeneratePasswordDialog } from '../staff/RegeneratePasswordDialog';
import { toast } from 'sonner';

export function OwnerProfileSettings() {
  const { user, tenant } = useAuth();
  const [regeneratePasswordOpen, setRegeneratePasswordOpen] = useState(false);

  const handlePasswordReset = () => {
    if (!user?.id) return;
    setRegeneratePasswordOpen(true);
  };

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load profile information. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and security preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="font-medium">{user.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium">{user.role}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {tenant && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hotel</label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.hotel_name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your account security and password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed: Not available
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handlePasswordReset}
                >
                  Reset Password
                </Button>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your account is secure and active. Password resets will generate a temporary password that you'll need to change on your next login.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Current status of your account and hotel subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-success">Active Account</p>
                <p className="text-sm text-muted-foreground">Full access enabled</p>
              </div>
            </div>
            
            {tenant && (
              <>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Subscription</p>
                    <p className="text-sm text-muted-foreground capitalize">{tenant.subscription_status}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Setup Status</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.setup_completed ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      {user && (
        <RegeneratePasswordDialog
          open={regeneratePasswordOpen}
          onOpenChange={setRegeneratePasswordOpen}
          userId={user.id}
          userEmail={user.email}
          userName={user.name || 'Owner'}
        />
      )}
    </div>
  );
}