import { useState } from 'react';
import { Plus, Edit, Trash2, Users, Mail, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGlobalUsers, useCreateGlobalUser, useUpdateGlobalUser, useDeleteGlobalUser, useTenants } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const GlobalUsers = () => {
  const { data: users, isLoading, error } = useGlobalUsers();
  const { data: tenants } = useTenants();
  const createUser = useCreateGlobalUser();
  const updateUser = useUpdateGlobalUser();
  const deleteUser = useDeleteGlobalUser();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  const handleCreateEdit = (user?: any) => {
    setSelectedUser(user || {
      name: '',
      email: '',
      role: '',
      department: '',
      permissions: [],
      assignedTenants: []
    });
    setDialogMode(user ? 'edit' : 'create');
    setIsDialogOpen(true);
  };

  const handleView = (user: any) => {
    setSelectedUser(user);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      department: formData.get('department'),
      permissions: selectedUser.permissions,
      assignedTenants: selectedUser.assignedTenants
    };

    if (dialogMode === 'edit') {
      updateUser.mutate({ id: selectedUser.id, data });
    } else {
      createUser.mutate(data);
    }
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'platform-admin': 'bg-red-100 text-red-800',
      'support-agent': 'bg-blue-100 text-blue-800',
      'auditor': 'bg-purple-100 text-purple-800',
      'integrator': 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatLastLogin = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Global User Management</h1>
          <p className="text-muted-foreground">Manage platform staff, integrators, and auditors</p>
        </div>
        <Button onClick={() => handleCreateEdit()} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Global User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Global Users</span>
          </CardTitle>
          <CardDescription>
            Platform users with global or multi-tenant access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Assigned Tenants</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.data?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatLastLogin(user.lastLogin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.assignedTenants?.length || 0} tenants</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleView(user)}>
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleCreateEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteUser.mutate(user.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Add Global User' : 
               dialogMode === 'edit' ? 'Edit Global User' : 'User Details'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'view' ? 'View user information and permissions' : 
               'Configure global user access and permissions'}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'view' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="font-medium">{selectedUser?.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedUser?.email}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge className={getRoleColor(selectedUser?.role)}>
                    {selectedUser?.role?.replace('-', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="font-medium">{selectedUser?.department}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedUser?.status)}>
                    {selectedUser?.status}
                  </Badge>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="font-medium">{formatLastLogin(selectedUser?.lastLogin)}</p>
                </div>
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUser?.permissions?.map((permission: string, index: number) => (
                    <Badge key={index} variant="secondary">{permission}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Assigned Tenants ({selectedUser?.assignedTenants?.length || 0})</Label>
                <div className="mt-2 space-y-2">
                  {selectedUser?.assignedTenants?.map((tenantId: string) => {
                    const tenant = tenants?.data?.find((t: any) => t.id === tenantId);
                    return (
                      <div key={tenantId} className="flex items-center space-x-2">
                        <Badge variant="outline">{tenant?.name || tenantId}</Badge>
                        <span className="text-sm text-muted-foreground">{tenant?.city}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={selectedUser?.name}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    defaultValue={selectedUser?.email}
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={selectedUser?.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform-admin">Platform Admin</SelectItem>
                      <SelectItem value="support-agent">Support Agent</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="integrator">Integrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select name="department" defaultValue={selectedUser?.department}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                  {dialogMode === 'edit' ? 'Update' : 'Create'} User
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalUsers;