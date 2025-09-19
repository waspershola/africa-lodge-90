import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, CreditCard, QrCode, Settings, Info } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface PermissionsStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const roles = [
  { id: 'OWNER', name: 'Owner', color: 'bg-purple-100 text-purple-800', icon: Shield },
  { id: 'MANAGER', name: 'Manager', color: 'bg-blue-100 text-blue-800', icon: Users },
  { id: 'FRONT_DESK', name: 'Front Desk', color: 'bg-green-100 text-green-800', icon: Users },
  { id: 'HOUSEKEEPING', name: 'Housekeeping', color: 'bg-yellow-100 text-yellow-800', icon: Users },
  { id: 'MAINTENANCE', name: 'Maintenance', color: 'bg-orange-100 text-orange-800', icon: Settings },
  { id: 'POS', name: 'POS Staff', color: 'bg-pink-100 text-pink-800', icon: CreditCard },
];

const permissions = [
  {
    id: 'staffInvite',
    name: 'Invite Staff Members',
    description: 'Create new staff accounts and send invitation emails',
    icon: Users,
    defaultRoles: ['OWNER'],
    recommendedRoles: ['OWNER', 'MANAGER'],
  },
  {
    id: 'pricingApproval',
    name: 'Approve/Override Pricing',
    description: 'Modify room rates, approve discounts, and override standard pricing',
    icon: CreditCard,
    defaultRoles: ['OWNER', 'MANAGER'],
    recommendedRoles: ['OWNER', 'MANAGER'],
  },
  {
    id: 'qrMenuManagement',
    name: 'Manage QR Service Menus',
    description: 'Configure room service menus, pricing, and QR code settings',
    icon: QrCode,
    defaultRoles: ['OWNER', 'MANAGER'],
    recommendedRoles: ['OWNER', 'MANAGER'],
  },
];

export function PermissionsStep({ data, updateData }: PermissionsStepProps) {
  const updatePermissions = (permissionId: string, roles: string[]) => {
    updateData({
      permissions: {
        ...data.permissions,
        [permissionId]: roles,
      },
    });
  };

  const toggleRole = (permissionId: string, roleId: string) => {
    const currentRoles = data.permissions[permissionId as keyof typeof data.permissions] || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(r => r !== roleId)
      : [...currentRoles, roleId];
    updatePermissions(permissionId, newRoles);
  };

  const applyRecommendedSettings = () => {
    const recommendedPermissions = {
      staffInvite: ['OWNER'],
      pricingApproval: ['OWNER', 'MANAGER'],
      qrMenuManagement: ['OWNER', 'MANAGER'],
    };
    
    updateData({
      permissions: recommendedPermissions,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Role Permissions Setup</h3>
        <p className="text-muted-foreground">
          Configure which staff roles can perform sensitive operations
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You can modify these permissions later from the staff management section. 
          We recommend starting with conservative settings and adjusting as needed.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Permission Settings</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={applyRecommendedSettings}
            >
              Apply Recommended
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {permissions.map((permission) => (
            <div key={permission.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start space-x-3">
                <permission.icon className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{permission.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {permission.description}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Select roles that can {permission.name.toLowerCase()}:
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {roles.map((role) => {
                    const isSelected = data.permissions[permission.id as keyof typeof data.permissions]?.includes(role.id) || false;
                    const isRecommended = permission.recommendedRoles.includes(role.id);
                    
                    return (
                      <div key={role.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${permission.id}-${role.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleRole(permission.id, role.id)}
                        />
                        <Label
                          htmlFor={`${permission.id}-${role.id}`}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <Badge variant="secondary" className={role.color}>
                            {role.name}
                          </Badge>
                          {isRecommended && (
                            <span className="text-xs text-green-600">(Recommended)</span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-1" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Permission Guidelines</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• <strong>Owner:</strong> Always has full access to all system functions</p>
                <p>• <strong>Manager:</strong> Recommended for operational decisions and staff oversight</p>
                <p>• <strong>Front Desk:</strong> Usually limited to guest services and basic operations</p>
                <p>• <strong>Housekeeping/Maintenance:</strong> Typically task-focused with limited admin access</p>
                <p>• <strong>POS Staff:</strong> Generally restricted to point-of-sale operations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
          <p className="text-sm text-blue-600">
            After setup, you'll be able to invite staff members and assign them specific roles. 
            Each role will have the permissions you've configured here, ensuring proper access control 
            throughout your hotel management system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}