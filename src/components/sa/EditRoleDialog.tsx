import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateRole, useDeleteRole, usePermissions } from '@/hooks/useRoles';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Trash2 } from 'lucide-react';
import { Role } from '@/services/roleService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

export function EditRoleDialog({ open, onOpenChange, role }: EditRoleDialogProps) {
  const { user } = useMultiTenantAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const { data: permissions } = usePermissions();

  // Check if user can edit this role
  const canEdit = () => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (user?.role === 'OWNER' && role?.scope === 'tenant' && role.name !== 'Owner') return true;
    if (user?.role === 'MANAGER' && role?.scope === 'tenant' && !['Owner', 'Manager'].includes(role.name)) return true;
    return false;
  };

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      
      // Set current permissions
      const currentPermissionIds = new Set(
        role.permissions?.map(p => p.id) || []
      );
      setSelectedPermissions(currentPermissionIds);
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateRole.mutateAsync({
        id: role.id,
        data: {
          name,
          description,
          permissions: Array.from(selectedPermissions)
        }
      });
      
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    const newPermissions = new Set(selectedPermissions);
    if (checked) {
      newPermissions.add(permissionId);
    } else {
      newPermissions.delete(permissionId);
    }
    setSelectedPermissions(newPermissions);
  };

  const handleDelete = async () => {
    try {
      await deleteRole.mutateAsync(role.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Filter permissions based on scope and user role
  const filteredPermissions = permissions?.filter(p => {
    if (role?.scope === 'global') {
      return p.module === 'tenants' || p.module === 'system' || p.module === 'dashboard' || p.module === 'reports';
    } else {
      return p.module !== 'tenants' && p.module !== 'system';
    }
  }) || [];

  const filteredPermissionsByModule = filteredPermissions.reduce((acc: any, permission: any) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Edit {role?.scope === 'global' ? 'Global' : 'Tenant'} Role</span>
          </DialogTitle>
          <DialogDescription>
            Modify role permissions and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter role name"
                required
                disabled={role?.is_system || !canEdit()}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this role can do"
                disabled={role?.is_system || !canEdit()}
                rows={3}
              />
            </div>
          </div>

          {(role?.is_system || !canEdit()) && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {role?.is_system 
                  ? 'This is a system role. You can only modify permissions for certain system roles.'
                  : 'You do not have permission to modify this role.'
                }
              </p>
            </div>
          )}

          <div>
            <Label className="text-lg font-semibold">Permissions</Label>
            <p className="text-sm text-muted-foreground mb-4">
              {(role?.is_system && !canEdit()) 
                ? 'View the permissions assigned to this role'
                : 'Modify the permissions this role should have'
              }
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(filteredPermissionsByModule).map(([module, modulePermissions]: [string, any]) => (
                <Card key={module} className="bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize">
                      {module.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {module} related permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {modulePermissions.map((permission: any) => (
                      <div key={permission.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label htmlFor={permission.id} className="text-sm font-medium">
                            {permission.action.charAt(0).toUpperCase() + permission.action.slice(1)}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                        <Switch
                          id={permission.id}
                          checked={selectedPermissions.has(permission.id)}
                          onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                          disabled={role?.is_system || !canEdit()}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {!role?.is_system && canEdit() && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteRole.isPending}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Role
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Role</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this role? This action cannot be undone.
                        All users with this role will lose their permissions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        Delete Role
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateRole.isPending}
              >
                Cancel
              </Button>
              {canEdit() && (
                <Button
                  type="submit"
                  disabled={updateRole.isPending || !name.trim()}
                >
                  {updateRole.isPending ? 'Updating...' : 'Update Role'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}