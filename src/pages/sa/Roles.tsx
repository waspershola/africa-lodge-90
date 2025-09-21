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

  const handleTabChange = (value: string) => {
    setActiveScope(value as 'global' | 'tenant');
  };

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
          <h1 className="text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-muted-foreground">Manage global roles and tenant role templates</p>
        </div>
        <Button onClick={() => handleCreateRole(activeScope)} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          {activeScope === 'global' ? 'Create Global Role' : 'Create Tenant Template'}
        </Button>
      </div>

      <Tabs defaultValue="global" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Global Roles</span>
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center space-x-2">
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

        <TabsContent value="tenant" className="space-y-6">
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
              {/* Show actual tenant role templates from database */}
              {tenantTemplates?.map((role) => (
                <Card key={role.id} className="hover:shadow-lg transition-shadow luxury-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <Badge className={role.is_system ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"}>
                            {role.is_system ? "System Template" : "Custom Template"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsPermissionsDialogOpen(true);
                          }}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        {!role.is_system && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRole(role);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                        <span className="font-medium">{role.permissions?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Scope:</span>
                        <Badge variant="secondary" className="capitalize">
                          Template
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant={role.is_system ? "default" : "outline"}>
                          {role.is_system ? "System" : "Custom"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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