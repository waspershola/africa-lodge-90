import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateRole, usePermissions } from '@/hooks/useRoles';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { Role } from '@/services/roleService';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

export function EditRoleDialog({ open, onOpenChange, role }: EditRoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  
  const updateRole = useUpdateRole();
  const { data: permissions } = usePermissions();

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

  // Filter permissions based on role scope
  const filteredPermissions = permissions?.filter(p => {
    if (role.scope === 'global') {
      return p.module === 'tenants' || p.module === 'system';
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
                disabled={role?.is_system}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this role can do"
                disabled={role?.is_system}
                rows={3}
              />
            </div>
          </div>

          {role?.is_system && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is a system role. You can view its permissions but cannot modify the role name, description, or permissions.
              </p>
            </div>
          )}

          <div>
            <Label className="text-lg font-semibold">Permissions</Label>
            <p className="text-sm text-muted-foreground mb-4">
              {role?.is_system 
                ? 'View the permissions assigned to this system role'
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
                          disabled={role?.is_system}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateRole.isPending}
            >
              Cancel
            </Button>
            {!role?.is_system && (
              <Button
                type="submit"
                disabled={updateRole.isPending || !name.trim()}
              >
                {updateRole.isPending ? 'Updating...' : 'Update Role'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}