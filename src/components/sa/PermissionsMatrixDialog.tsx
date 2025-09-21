import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Edit, Trash2 } from 'lucide-react';
import { Role } from '@/services/roleService';

interface PermissionsMatrixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

export function PermissionsMatrixDialog({ open, onOpenChange, role }: PermissionsMatrixDialogProps) {
  // Group permissions by module
  const permissionsByModule = role.permissions?.reduce((acc: any, permission: any) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {}) || {};

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'read':
      case 'view':
        return Eye;
      case 'write':
      case 'create':
      case 'update':
      case 'edit':
        return Edit;
      case 'delete':
        return Trash2;
      case 'manage':
      case 'admin':
        return Shield;
      default:
        return Lock;
    }
  };

  const getScopeColor = (scope: string) => {
    return scope === 'global' 
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
  };

  const getModuleColor = (module: string) => {
    const colors = {
      dashboard: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      reservations: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      billing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      rooms: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
      staff: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      housekeeping: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      maintenance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      reports: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      settings: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
      tenants: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
      system: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'
    };
    return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Permissions Matrix - {role.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getScopeColor(role.scope)}>
                {role.scope}
              </Badge>
              <Badge variant={role.is_system ? "default" : "secondary"}>
                {role.is_system ? "System Role" : "Custom Role"}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of all permissions assigned to this role. 
            Total permissions: {role.permissions?.length || 0}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Information */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Role Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">{role.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scope</p>
                  <Badge className={getScopeColor(role.scope)}>
                    {role.scope === 'global' ? 'Platform Wide' : 'Tenant Specific'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant={role.is_system ? "default" : "secondary"}>
                    {role.is_system ? "System Managed" : "Custom Role"}
                  </Badge>
                </div>
              </div>
              {role.description && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{role.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions by Module */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Permissions by Module</h3>
            
            {Object.keys(permissionsByModule).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No permissions assigned to this role</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(permissionsByModule).map(([module, modulePermissions]: [string, any]) => (
                  <Card key={module} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium capitalize">
                          {module.replace(/_/g, ' ')}
                        </CardTitle>
                        <Badge className={getModuleColor(module)} variant="secondary">
                          {modulePermissions.length}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {module.charAt(0).toUpperCase() + module.slice(1)} module permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {modulePermissions.map((permission: any) => {
                        const IconComponent = getActionIcon(permission.action);
                        return (
                          <div key={permission.id} className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                            <IconComponent className="h-3 w-3 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {permission.action.charAt(0).toUpperCase() + permission.action.slice(1)}
                              </p>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Permission Summary */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Permission Summary</CardTitle>
              <CardDescription>
                Overview of permissions across different modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(permissionsByModule).map(([module, modulePermissions]: [string, any]) => (
                  <div key={module} className="flex items-center justify-between p-2 rounded-md bg-background">
                    <div className="flex items-center space-x-2">
                      <Badge className={getModuleColor(module)} variant="secondary">
                        {module.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {modulePermissions.length} permission{modulePermissions.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex space-x-1">
                        {modulePermissions.slice(0, 3).map((permission: any, index: number) => {
                          const IconComponent = getActionIcon(permission.action);
                          return (
                            <IconComponent key={index} className="h-3 w-3 text-muted-foreground" />
                          );
                        })}
                        {modulePermissions.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{modulePermissions.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}