import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRole, usePermissions } from '@/hooks/useRoles';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: 'global' | 'tenant';
  tenantId?: string;
}

export function CreateRoleDialog({ open, onOpenChange, scope, tenantId }: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  
  const createRole = useCreateRole();
  const { data: permissions } = usePermissions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createRole.mutateAsync({
        name,
        description,
        scope,
        tenant_id: scope === 'tenant' ? (tenantId || null) : null,
        permissions: Array.from(selectedPermissions)
      });
      
      // Reset form
      setName('');
      setDescription('');
      setSelectedPermissions(new Set());
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

  // Group permissions by module
  const permissionsByModule = permissions?.reduce((acc: any, permission: any) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {}) || {};

  // Filter permissions based on scope
  const filteredPermissions = permissions?.filter(p => {
    if (scope === 'global') {
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
            <span>Create {scope === 'global' ? 'Global' : 'Tenant'} Role</span>
          </DialogTitle>
          <DialogDescription>
            Define a new role with specific permissions for {scope === 'global' ? 'platform-wide' : 'tenant'} access
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
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this role can do"
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Permissions</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select the permissions this role should have
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
              disabled={createRole.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRole.isPending || !name.trim()}
            >
              {createRole.isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}