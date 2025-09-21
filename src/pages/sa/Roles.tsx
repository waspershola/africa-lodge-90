import { useState } from 'react';
import { Plus, Edit, Trash2, Shield, Users, Globe, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalRoles, useTenantRoles, usePermissions, useRoles } from '@/hooks/useRoles';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { CreateRoleDialog } from '@/components/sa/CreateRoleDialog';
import { EditRoleDialog } from '@/components/sa/EditRoleDialog';
import { PermissionsMatrixDialog } from '@/components/sa/PermissionsMatrixDialog';

const Roles = () => {
  const { data: globalRoles, isLoading: globalLoading, error: globalError } = useGlobalRoles();
  const { data: tenantTemplates, isLoading: templatesLoading } = useRoles('tenant');
  const { data: permissions } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [activeScope, setActiveScope] = useState<'global' | 'tenant'>('global');

  const handleCreateRole = (scope: 'global' | 'tenant') => {
    setActiveScope(scope);
    setIsCreateDialogOpen(true);
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const handleViewPermissions = (role: any) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
  };

  const getScopeColor = (scope: string) => {
    return scope === 'global' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
  };

  const getPermissionCount = (permissions: any[]) => {
    return permissions?.length || 0;
  };

  if (globalLoading) return <LoadingState />;
  if (globalError) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Global Role Management</h1>
          <p className="text-muted-foreground">Manage platform-wide roles and permissions</p>
        </div>
        <Button onClick={() => handleCreateRole('global')} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Global Role
        </Button>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Global Roles</span>
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Tenant Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {globalRoles?.map((role: any) => (
              <Card key={role.id} className="hover:shadow-lg transition-shadow luxury-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <Badge className={getScopeColor(role.scope)}>
                          {role.scope}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleViewPermissions(role)}>
                        <Shield className="h-4 w-4" />
                      </Button>
                      {!role.is_system && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleEditRole(role)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {role.description}
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Permissions:</span>
                      <span className="font-medium">{getPermissionCount(role.permissions)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant={role.is_system ? "default" : "secondary"}>
                        {role.is_system ? "System" : "Custom"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="template" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Tenant Role Templates</h2>
              <p className="text-muted-foreground">Default roles created for each new tenant</p>
            </div>
            <Button onClick={() => handleCreateRole('tenant')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          {templatesLoading ? (
            <LoadingState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenantTemplates
                ?.filter((role: any) => role.is_system && !role.tenant_id)
                ?.map((template: any) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow luxury-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            Template
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleViewPermissions(template)}>
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditRole(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {template.description}
                    </CardDescription>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Permissions:</span>
                        <span className="font-medium">{getPermissionCount(template.permissions)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Applied to:</span>
                        <Badge variant="secondary">
                          All new tenants
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add cards for roles that should exist but might not be created yet */}
              {['Owner', 'Manager', 'Front Desk', 'Housekeeping', 'Accounting', 'Maintenance'].map((roleName) => {
                const exists = tenantTemplates?.some((t: any) => t.name === roleName && t.is_system);
                if (exists) return null;
                
                const descriptions = {
                  'Owner': 'Full control over the hotel',
                  'Manager': 'Day-to-day operations management',
                  'Front Desk': 'Guest services and reservations',
                  'Housekeeping': 'Room maintenance and cleaning',
                  'Accounting': 'Financial management',
                  'Maintenance': 'Facility maintenance'
                };
                
                return (
                  <Card key={roleName} className="border-dashed border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-lg text-muted-foreground">{roleName}</CardTitle>
                            <Badge variant="outline">Missing Template</Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedRole({ name: roleName, description: descriptions[roleName as keyof typeof descriptions], scope: 'tenant' });
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {descriptions[roleName as keyof typeof descriptions]}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">
                        Click the + button to create this template
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateRoleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        scope={activeScope}
      />

      {selectedRole && (
        <EditRoleDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          role={selectedRole}
        />
      )}

      {selectedRole && (
        <PermissionsMatrixDialog
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
          role={selectedRole}
        />
      )}
    </div>
  );
};

export default Roles;