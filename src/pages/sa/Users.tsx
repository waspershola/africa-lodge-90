import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UsersRound, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Building2,
  Mail,
  Calendar,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useGlobalUsers, useCreateGlobalUser, useUpdateGlobalUser, useDeleteGlobalUser } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

const userTypes = [
  { id: 'platform', name: 'Platform Staff', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'integrator', name: 'External Integrator', color: 'bg-accent/10 text-accent border-accent/20' },
  { id: 'auditor', name: 'Auditor', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'support', name: 'Support Team', color: 'bg-success/10 text-success border-success/20' }
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const { data: usersData, isLoading, error, refetch } = useGlobalUsers();
  const createUser = useCreateGlobalUser();
  const updateUser = useUpdateGlobalUser();
  const deleteUser = useDeleteGlobalUser();

  if (isLoading) return <LoadingState message="Loading users..." />;
  if (error) return <ErrorState message="Failed to load users" onRetry={refetch} />;

  const users = usersData?.data || [];
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || user.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreateUser = async (data: any) => {
    try {
      await createUser.mutateAsync(data);
      toast({ title: "User created successfully" });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to create user", variant: "destructive" });
    }
  };

  const handleUpdateUser = async (data: any) => {
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, ...data });
      toast({ title: "User updated successfully" });
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
      toast({ title: "User deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await updateUser.mutateAsync({ 
        id: user.id, 
        status: user.status === 'active' ? 'inactive' : 'active' 
      });
      toast({ title: `User ${user.status === 'active' ? 'deactivated' : 'activated'} successfully` });
    } catch (error) {
      toast({ title: "Failed to update user status", variant: "destructive" });
    }
  };

  const getUserTypeStyle = (type: string) => {
    return userTypes.find(t => t.id === type)?.color || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold display-heading text-gradient">Global User Management</h1>
          <p className="text-muted-foreground mt-2">Manage platform staff, integrators, and other non-hotel users</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleCreateUser} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {userTypes.map((type) => {
          const count = users.filter((u: any) => u.type === type.id).length;
          return (
            <Card key={type.id} className="modern-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {type.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{count}</div>
                <Badge className={type.color + " mt-2"}>
                  {count > 0 ? 'Active' : 'None'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={fadeIn} className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {userTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Global Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tenant Access</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUserTypeStyle(user.type)}>
                        {userTypes.find(t => t.id === user.type)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {user.tenantAccess === 'global' ? 'Global' : `${user.assignedTenants?.length || 0} hotels`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.status === 'active'}
                          onCheckedChange={() => handleToggleStatus(user)}
                        />
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-danger hover:text-danger hover:bg-danger/10"
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
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserForm 
              initialData={selectedUser}
              onSubmit={handleUpdateUser}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function UserForm({ initialData, onSubmit }: { initialData?: any; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    type: initialData?.type || 'platform',
    tenantAccess: initialData?.tenantAccess || 'global',
    permissions: initialData?.permissions || [],
    status: initialData?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">User Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({...formData, type: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tenantAccess">Tenant Access</Label>
          <Select 
            value={formData.tenantAccess} 
            onValueChange={(value) => setFormData({...formData, tenantAccess: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global Access</SelectItem>
              <SelectItem value="specific">Specific Tenants</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit">
          {initialData ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}