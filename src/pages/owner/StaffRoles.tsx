import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus, Edit, Shield, Users } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTenantRoles } from '@/hooks/useRoles';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { CreateRoleDialog } from '@/components/sa/CreateRoleDialog';
import { EditRoleDialog } from '@/components/sa/EditRoleDialog';
import { PermissionsMatrixDialog } from '@/components/sa/PermissionsMatrixDialog';
import StaffDirectory from "@/components/owner/staff/StaffDirectory";
import { EnhancedStaffInvitationDialog } from "@/components/owner/staff/EnhancedStaffInvitationDialog";

export default function StaffRoles() {
  const { user } = useMultiTenantAuth();
  const { data: tenantRoles, isLoading, error } = useTenantRoles(user?.tenant_id || '');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  const handleCreateRole = () => {
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

  const getPermissionCount = (permissions: any[]) => {
    return permissions?.length || 0;
  };

  const canEditRole = (role: any) => {
    // Owners can edit all roles except Owner role itself
    // Managers can only edit roles below their level
    if (user?.role === 'OWNER') {
      return role.name !== 'Owner';
    } else if (user?.role === 'MANAGER') {
      return !['Owner', 'Manager'].includes(role.name);
    }
    return false;
  };

  const systemRoles = tenantRoles?.filter((role: any) => role.is_system) || [];
  const customRoles = tenantRoles?.filter((role: any) => !role.is_system) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Staff & Role Management</h1>
          <p className="text-muted-foreground">Manage your hotel staff and configure role permissions.</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="bg-gradient-primary shadow-luxury hover:shadow-hover">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          <TabsTrigger value="system-roles">System Roles</TabsTrigger>
          <TabsTrigger value="custom-roles">Custom Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <StaffDirectory />
        </TabsContent>

        <TabsContent value="system-roles" className="space-y-6">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemRoles.map((role: any) => (
                <Card key={role.id} className="hover:shadow-lg transition-shadow luxury-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <Badge variant="default">
                            System Role
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleViewPermissions(role)}>
                          <Shield className="h-4 w-4" />
                        </Button>
                        {canEditRole(role) && (
                          <Button size="sm" variant="ghost" onClick={() => handleEditRole(role)}>
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
                        <span className="font-medium">{getPermissionCount(role.permissions)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Editable:</span>
                        <Badge variant={canEditRole(role) ? "secondary" : "outline"}>
                          {canEditRole(role) ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom-roles" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Custom Roles</h2>
              <p className="text-muted-foreground">Create custom roles with specific permissions</p>
            </div>
            <Button onClick={handleCreateRole} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Role
            </Button>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : customRoles.length === 0 ? (
            <Card className="luxury-card">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No Custom Roles</CardTitle>
                <CardDescription className="mb-6">
                  You haven't created any custom roles yet. Create custom roles to assign specific permissions to your staff.
                </CardDescription>
                <Button onClick={handleCreateRole} className="bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Custom Role
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customRoles.map((role: any) => (
                <Card key={role.id} className="hover:shadow-lg transition-shadow luxury-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <Badge variant="secondary">
                            Custom Role
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleViewPermissions(role)}>
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditRole(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EnhancedStaffInvitationDialog 
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      <CreateRoleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        scope="tenant"
        tenantId={user?.tenant_id}
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
}