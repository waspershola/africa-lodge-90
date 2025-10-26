import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Edit, Trash2, Building2, Mail, MapPin, 
  MoreHorizontal, Eye, UserCheck, Pause, Play, Filter,
  Crown, Key, RefreshCw, Settings, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { DataEmpty } from '@/components/ui/data-empty';
import { 
  useTenantsReal, 
  useTenantMetrics, 
  useDeleteTenantReal, 
  useSuspendTenantReal, 
  useReactivateTenantReal 
} from '@/hooks/useTenants';
import { CreateTenantRealForm } from '@/components/sa/CreateTenantForm';
import { TenantDetailsDrawer } from '@/components/sa/TenantDetailsDrawer';
import { ImpersonationModal } from '@/components/sa/ImpersonationModal';
import { PasswordResetDialog } from '@/components/sa/PasswordResetDialog';
import { EditTenantDialog } from '@/components/sa/EditTenantDialog';
import { InviteUserDialog } from '@/components/sa/InviteUserDialog';

import type { TenantWithOwner } from '@/services/tenantService';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function TenantsReal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithOwner | null>(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showImpersonation, setShowImpersonation] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  
  const { data: tenants = [], isLoading, error, refetch } = useTenantsReal();
  const { data: metrics } = useTenantMetrics();
  const deleteTenant = useDeleteTenantReal();
  const suspendTenant = useSuspendTenantReal();
  const reactivateTenant = useReactivateTenantReal();

  if (isLoading) return <LoadingState message="Loading tenants..." />;
  if (error) return <ErrorState message="Failed to load tenants" onRetry={refetch} />;

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (action: string, tenant: TenantWithOwner) => {
    setSelectedTenant(tenant);
    
    switch (action) {
      case 'view':
        setShowTenantDetails(true);
        break;
      case 'impersonate':
        setShowImpersonation(true);
        break;
      case 'reset-password':
        setShowPasswordReset(true);
        break;
      case 'resend-invite':
        // TODO: Implement resend invite
        console.log('Resend invite for:', tenant.owner_email);
        break;
      case 'pause-billing':
        if (confirm(`Are you sure you want to pause billing for ${tenant.hotel_name}?`)) {
          // TODO: Implement pause billing
          console.log('Pause billing for:', tenant.tenant_id);
        }
        break;
      case 'force-logout':
        if (confirm(`Are you sure you want to force logout all users for ${tenant.hotel_name}?`)) {
          // TODO: Implement force logout
          console.log('Force logout for:', tenant.tenant_id);
        }
        break;
      case 'delete':
        if (confirm(`Are you sure you want to PERMANENTLY DELETE ${tenant.hotel_name}? This action cannot be undone and will remove all data.`)) {
          try {
            await deleteTenant.mutateAsync(tenant.tenant_id);
          } catch (error) {
            console.error('Delete failed:', error);
          }
        }
        break;
      case 'reactivate':
        console.log('Reactivating tenant:', tenant?.tenant_id);
        if (tenant && confirm(`Are you sure you want to reactivate ${tenant.hotel_name}? They will regain access to the platform.`)) {
          try {
            await reactivateTenant.mutateAsync(tenant.tenant_id);
          } catch (error) {
            console.error('Reactivate failed:', error);
          }
        }
        if (confirm(`Are you sure you want to suspend ${tenant.hotel_name}? They will lose access but data will be preserved.`)) {
          try {
            await suspendTenant.mutateAsync(tenant.tenant_id);
          } catch (error) {
            console.error('Suspend failed:', error);
          }
        }
        break;
      case 'reactivate':
        if (confirm(`Are you sure you want to reactivate ${tenant.hotel_name}? They will regain full access.`)) {
          try {
            await reactivateTenant.mutateAsync(tenant.tenant_id);
          } catch (error) {
            console.error('Reactivation failed:', error);
          }
        }
        break;
      case 'edit':
        setShowEditDialog(true);
        break;
      case 'invite-staff':
        setShowInviteDialog(true);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleImpersonation = (details: { userId: string; reason: string; duration: number }) => {
    console.log('Impersonating user:', details);
    // TODO: Implement actual impersonation
    setShowImpersonation(false);
    setSelectedTenant(null);
  };

  const handlePasswordReset = (email: string) => {
    console.log('Resetting password for:', email);
    // TODO: Implement password reset
    setShowPasswordReset(false);
    setSelectedTenant(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      trialing: 'secondary',
      suspended: 'destructive',
      expired: 'destructive',
      canceled: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (filteredTenants.length === 0 && !searchTerm && tenants.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold display-heading text-gradient">Tenants</h1>
        </div>
        <DataEmpty 
          message="No tenants found"
          description="Create your first tenant to get started"
          action={
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tenant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Tenant & Owner</DialogTitle>
                </DialogHeader>
            <CreateTenantRealForm onSuccess={() => setCreateModalOpen(false)} />
              </DialogContent>
            </Dialog>
          }
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      
      {/* Header */}
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Tenants</h1>
          <p className="text-muted-foreground">Manage hotel properties and their subscriptions</p>
        </div>
        
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
              <Plus className="h-4 w-4 mr-2" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Tenant & Owner</DialogTitle>
            </DialogHeader>
            <CreateTenantRealForm onSuccess={() => setCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={fadeIn} className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('trialing')}>Trialing</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>Suspended</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('expired')}>Expired</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Stats Cards */}
      {metrics && (
        <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="modern-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{metrics.total_tenants}</div>
            </CardContent>
          </Card>
          
          <Card className="modern-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{metrics.active_subscriptions}</div>
            </CardContent>
          </Card>
          
          <Card className="modern-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{metrics.trial_tenants}</div>
            </CardContent>
          </Card>
          
          <Card className="modern-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {tenants.reduce((sum, t) => sum + (t.total_rooms || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tenants Table */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.tenant_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{tenant.hotel_name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.hotel_slug}</div>
                      </div>
                    </div>
                  </TableCell>
                   <TableCell>
                     <div>
                       <div className="font-medium">{tenant.owner_name || 'N/A'}</div>
                       <div className="text-sm text-muted-foreground flex items-center gap-1">
                         <Mail className="h-3 w-3" />
                         {tenant.owner_email || 'N/A'}
                       </div>
                       {tenant.owner_phone && (
                         <div className="text-xs text-muted-foreground">
                           {tenant.owner_phone}
                         </div>
                       )}
                     </div>
                   </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.plan_name || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant.subscription_status)}</TableCell>
                  <TableCell>{tenant.total_rooms || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {tenant.city || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction('view', tenant)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('impersonate', tenant)}>
                          <Crown className="h-4 w-4 mr-2" />
                          Impersonate Owner
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('reset-password', tenant)}>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('resend-invite', tenant)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('pause-billing', tenant)}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Billing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('force-logout', tenant)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Force Logout
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('invite-staff', tenant)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Staff
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction('edit', tenant)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {tenant.subscription_status === 'active' || tenant.subscription_status === 'trialing' ? (
                          <DropdownMenuItem 
                            onClick={() => handleAction('suspend', tenant)}
                            className="text-orange-600"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleAction('reactivate', tenant)}
                            className="text-green-600"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleAction('delete', tenant)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {filteredTenants.length === 0 && searchTerm && (
        <motion.div variants={fadeIn}>
          <DataEmpty 
            message="No tenants match your search"
            description={`No results found for "${searchTerm}"`}
          />
        </motion.div>
      )}

      {/* Tenant Details Drawer */}
      <TenantDetailsDrawer
        tenant={selectedTenant}
        isOpen={showTenantDetails}
        onClose={() => {
          setShowTenantDetails(false);
          setSelectedTenant(null);
        }}
        onAction={handleAction}
      />

      {/* Impersonation Modal */}
      <ImpersonationModal
        tenant={selectedTenant}
        isOpen={showImpersonation}
        onClose={() => {
          setShowImpersonation(false);
          setSelectedTenant(null);
        }}
        onConfirm={handleImpersonation}
      />

      {/* Password Reset Dialog */}
      <PasswordResetDialog
        tenant={selectedTenant}
        isOpen={showPasswordReset}
        onClose={() => {
          setShowPasswordReset(false);
          setSelectedTenant(null);
        }}
        onConfirm={handlePasswordReset}
      />

      {/* Edit Tenant Dialog */}
      <EditTenantDialog
        tenant={selectedTenant}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedTenant(null);
        }}
      />

      {/* Invite User Dialog */}
      <InviteUserDialog
        tenantId={selectedTenant?.tenant_id}
        onSuccess={() => {
          setShowInviteDialog(false);
          setSelectedTenant(null);
          refetch(); // Refresh tenant list
        }}
      />

    </motion.div>
  );
}