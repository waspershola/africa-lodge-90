import { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const Roles = () => {
  const { data: roles, isLoading, error } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  const handleCreateEdit = (role?: any) => {
    setSelectedRole(role || {
      name: '',
      description: '',
      scope: 'tenant',
      permissions: {
        dashboard: { read: false, write: false },
        reservations: { read: false, write: false, cancel: false },
        rooms: { read: false, write: false },
        staff: { read: false, write: false, manage: false },
        reports: { read: false, write: false, export: false },
        billing: { read: false, write: false },
        settings: { read: false, write: false }
      }
    });
    setDialogMode(role ? 'edit' : 'create');
    setIsDialogOpen(true);
  };

  const handleView = (role: any) => {
    setSelectedRole(role);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      scope: formData.get('scope'),
      permissions: selectedRole.permissions
    };

    if (dialogMode === 'edit') {
      updateRole.mutate({ id: selectedRole.id, data });
    } else {
      createRole.mutate(data);
    }
    setIsDialogOpen(false);
  };

  const updatePermission = (module: string, permission: string, value: boolean) => {
    setSelectedRole((prev: any) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [permission]: value
        }
      }
    }));
  };

  const getScopeColor = (scope: string) => {
    return scope === 'global' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  const getPermissionCount = (permissions: any) => {
    let count = 0;
    Object.values(permissions).forEach((module: any) => {
      count += Object.values(module).filter(Boolean).length;
    });
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-muted-foreground">Manage global roles and permissions for platform users</p>
        </div>
        <Button onClick={() => handleCreateEdit()} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles?.map((role: any) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
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
                  <Button size="sm" variant="ghost" onClick={() => handleView(role)}>
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCreateEdit(role)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteRole.mutate(role.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scope:</span>
                  <span className="font-medium capitalize">{role.scope}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create Role' : 
               dialogMode === 'edit' ? 'Edit Role' : 'Role Details'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'view' ? 'View role permissions and configuration' : 
               'Configure role permissions and access levels'}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'view' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role Name</Label>
                  <p className="font-medium">{selectedRole?.name}</p>
                </div>
                <div>
                  <Label>Scope</Label>
                  <Badge className={getScopeColor(selectedRole?.scope)}>
                    {selectedRole?.scope}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{selectedRole?.description}</p>
              </div>
              
              <div>
                <Label className="text-lg">Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {Object.entries(selectedRole?.permissions || {}).map(([module, perms]: [string, any]) => (
                    <Card key={module}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize">{module}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(perms).map(([perm, value]: [string, any]) => (
                            <div key={perm} className="flex justify-between items-center">
                              <span className="text-sm capitalize">{perm}</span>
                              <Badge variant={value ? "default" : "secondary"}>
                                {value ? "Allowed" : "Denied"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={selectedRole?.name}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="scope">Scope</Label>
                  <Select name="scope" defaultValue={selectedRole?.scope}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={selectedRole?.description}
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-lg">Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {Object.entries(selectedRole?.permissions || {}).map(([module, perms]: [string, any]) => (
                    <Card key={module}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize">{module}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(perms).map(([perm, value]: [string, any]) => (
                            <div key={perm} className="flex items-center justify-between">
                              <Label htmlFor={`${module}-${perm}`} className="text-sm capitalize">
                                {perm}
                              </Label>
                              <Switch
                                id={`${module}-${perm}`}
                                checked={value}
                                onCheckedChange={(checked) => updatePermission(module, perm, checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                  {dialogMode === 'edit' ? 'Update' : 'Create'} Role
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roles;