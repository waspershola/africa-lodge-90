import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCog, 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  Eye,
  Lock,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  FileText,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

const permissionCategories = [
  { 
    id: 'reservations', 
    name: 'Reservations', 
    icon: FileText, 
    permissions: ['view', 'create', 'edit', 'delete', 'checkin', 'checkout'] 
  },
  { 
    id: 'guests', 
    name: 'Guest Management', 
    icon: Users, 
    permissions: ['view', 'create', 'edit', 'delete', 'notes'] 
  },
  { 
    id: 'rooms', 
    name: 'Room Management', 
    icon: Settings, 
    permissions: ['view', 'edit', 'maintenance', 'pricing'] 
  },
  { 
    id: 'billing', 
    name: 'Billing & Payments', 
    icon: CreditCard, 
    permissions: ['view', 'process', 'refund', 'reports'] 
  },
  { 
    id: 'reports', 
    name: 'Reports & Analytics', 
    icon: BarChart3, 
    permissions: ['view', 'export', 'financial', 'operational'] 
  }
];

const rolePresets = [
  {
    name: 'Hotel Owner',
    description: 'Full access to all hotel operations',
    permissions: { reservations: ['view', 'create', 'edit', 'delete', 'checkin', 'checkout'], guests: ['view', 'create', 'edit', 'delete', 'notes'], rooms: ['view', 'edit', 'maintenance', 'pricing'], billing: ['view', 'process', 'refund', 'reports'], reports: ['view', 'export', 'financial', 'operational'] }
  },
  {
    name: 'Front Desk Manager',
    description: 'Manage reservations, guests, and front desk operations',
    permissions: { reservations: ['view', 'create', 'edit', 'checkin', 'checkout'], guests: ['view', 'create', 'edit', 'notes'], rooms: ['view'], billing: ['view', 'process'], reports: ['view'] }
  },
  {
    name: 'Front Desk Agent',
    description: 'Handle check-in/out and basic guest services',
    permissions: { reservations: ['view', 'checkin', 'checkout'], guests: ['view'], rooms: ['view'], billing: ['view'], reports: [] }
  },
  {
    name: 'Accountant',
    description: 'Manage billing, payments, and financial reports',
    permissions: { reservations: ['view'], guests: [], rooms: [], billing: ['view', 'process', 'refund', 'reports'], reports: ['view', 'export', 'financial'] }
  }
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Roles() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const { toast } = useToast();

  const { data: rolesData, isLoading, error, refetch } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  if (isLoading) return <LoadingState message="Loading roles..." />;
  if (error) return <ErrorState message="Failed to load roles" onRetry={refetch} />;

  const roles = rolesData?.data || [];

  const handleCreateRole = async (data: any) => {
    try {
      await createRole.mutateAsync(data);
      toast({ title: "Role created successfully" });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to create role", variant: "destructive" });
    }
  };

  const handleUpdateRole = async (data: any) => {
    try {
      await updateRole.mutateAsync({ id: selectedRole.id, ...data });
      toast({ title: "Role updated successfully" });
      setEditDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast({ title: "Failed to update role", variant: "destructive" });
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRole.mutateAsync(id);
      toast({ title: "Role deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete role", variant: "destructive" });
    }
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
          <h1 className="text-3xl font-bold display-heading text-gradient">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-2">Manage global roles and permission templates for hotels</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <RoleForm onSubmit={handleCreateRole} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Role Presets */}
      <motion.div variants={fadeIn}>
        <h2 className="text-xl font-semibold mb-4">Role Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rolePresets.map((preset, index) => (
            <Card key={index} className="modern-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setSelectedRole({ ...preset, id: null });
                    setCreateDialogOpen(true);
                  }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {preset.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{preset.description}</p>
                <Badge variant="outline" className="text-xs">
                  Use Template
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Existing Roles */}
      <motion.div variants={fadeIn}>
        <h2 className="text-xl font-semibold mb-4">Custom Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role: any) => (
            <Card key={role.id} className="modern-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    {role.name}
                  </CardTitle>
                  <Badge variant={role.isDefault ? 'default' : 'outline'}>
                    {role.isDefault ? 'System' : 'Custom'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-success" />
                    <span>{role.assignedCount || 0} users assigned</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>{Object.keys(role.permissions || {}).length} permission groups</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role);
                      setEditDialogOpen(true);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  {!role.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-danger hover:text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <RoleForm 
              initialData={selectedRole}
              onSubmit={handleUpdateRole}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function RoleForm({ initialData, onSubmit }: { initialData?: any; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissions: initialData?.permissions || {}
  });

  const handlePermissionChange = (category: string, permission: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: enabled 
          ? [...(prev.permissions[category] || []), permission]
          : (prev.permissions[category] || []).filter((p: string) => p !== permission)
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Role Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Front Desk Manager"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe this role's responsibilities..."
          rows={3}
        />
      </div>

      <div>
        <Label>Permissions</Label>
        <div className="space-y-6 mt-4">
          {permissionCategories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <category.icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{category.name}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {category.permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Switch
                      id={`${category.id}-${permission}`}
                      checked={(formData.permissions[category.id] || []).includes(permission)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(category.id, permission, checked)
                      }
                    />
                    <Label 
                      htmlFor={`${category.id}-${permission}`}
                      className="text-sm capitalize"
                    >
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit">
          {initialData ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
}
