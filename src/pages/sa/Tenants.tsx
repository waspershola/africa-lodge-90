import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Building2, Mail, MapPin, Clock, UserCheck, Pause, Play, Upload, Download, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { DataEmpty } from '@/components/ui/data-empty';
import { useTenants, useDeleteTenant, useSuspendTenant, useReactivateTenant, useImpersonateTenant, useBulkImportTenants } from '@/hooks/useApi';
import { CreateTenantForm } from '@/components/sa/CreateTenantForm';
import { EditTenantForm } from '@/components/sa/EditTenantForm';
import TenantDrawer from '@/components/sa/TenantDrawer';
import type { Tenant } from '@/lib/api/mockAdapter';

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

export default function Tenants() {
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { data: tenantsData, isLoading, error, refetch } = useTenants();
  const deleteTenant = useDeleteTenant();
  const suspendTenant = useSuspendTenant();
  const reactivateTenant = useReactivateTenant();
  const impersonateTenant = useImpersonateTenant();
  const bulkImportTenants = useBulkImportTenants();

  if (isLoading) return <LoadingState message="Loading tenants..." />;
  if (error) return <ErrorState message="Failed to load tenants" onRetry={refetch} />;

  const tenants = tenantsData?.data || [];
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      deleteTenant.mutate(id);
    }
  };

  const handleSuspend = async (id: string) => {
    if (confirm('Are you sure you want to suspend this tenant?')) {
      suspendTenant.mutate(id);
    }
  };

  const handleReactivate = async (id: string) => {
    if (confirm('Are you sure you want to reactivate this tenant?')) {
      reactivateTenant.mutate(id);
    }
  };

  const handleImpersonate = async (id: string) => {
    impersonateTenant.mutate(id);
  };

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDrawerOpen(true);
  };

  const handleTenantAction = (action: string, tenantId: string) => {
    switch (action) {
      case 'impersonate':
        handleImpersonate(tenantId);
        break;
      case 'suspend':
        const tenant = tenants.find(t => t.id === tenantId);
        if (tenant?.status === 'active') {
          handleSuspend(tenantId);
        } else {
          handleReactivate(tenantId);
        }
        break;
      // Add other actions as needed
      default:
        console.log('Action not implemented:', action);
    }
    setDrawerOpen(false);
  };

  const handleBulkImport = () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target?.result as string;
        const lines = csvData.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, index) => ({
            ...obj,
            [header.trim()]: values[index]?.trim()
          }), {});
        });
        
        bulkImportTenants.mutate(data);
        setBulkImportOpen(false);
        setSelectedFile(null);
      } catch (error) {
        console.error('Failed to parse CSV:', error);
      }
    };
    reader.readAsText(selectedFile);
  };

  const exportToCSV = () => {
    const csvContent = [
      'name,slug,contactEmail,city,totalRooms,plan,status',
      ...tenants.map(t => `${t.name},${t.slug},${t.contactEmail},${t.city},${t.totalRooms},${t.plan},${t.status}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenants-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      suspended: 'destructive',
      inactive: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      Starter: 'outline',
      Growth: 'secondary',
      Pro: 'default'
    } as const;
    
    return (
      <Badge variant={variants[plan as keyof typeof variants] || 'outline'}>
        {plan}
      </Badge>
    );
  };

  if (filteredTenants.length === 0 && !searchTerm) {
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
                  <DialogTitle>Create New Tenant</DialogTitle>
                </DialogHeader>
                <CreateTenantForm onSuccess={() => setCreateModalOpen(false)} />
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
        
        <div className="flex gap-2">
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
                <Plus className="h-4 w-4 mr-2" />
                Create Tenant
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
            </DialogHeader>
            <CreateTenantForm onSuccess={() => setCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setBulkImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeIn}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{tenants.length}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {tenants.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pro Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {tenants.filter(t => t.plan === 'Pro').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {tenants.reduce((sum, t) => sum + t.totalRooms, 0)}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tenants Table */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Offline Window</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {tenant.contactEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell>{tenant.totalRooms}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {tenant.offlineWindowHours}h
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {tenant.city}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewTenant(tenant)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleImpersonate(tenant.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Impersonate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <Sheet>
                            <SheetTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-md">
                              <SheetHeader>
                                <SheetTitle>Edit Tenant</SheetTitle>
                              </SheetHeader>
                              <EditTenantForm 
                                tenant={tenant}
                                onSuccess={() => setEditingTenant(null)}
                              />
                            </SheetContent>
                          </Sheet>
                          <DropdownMenuSeparator />
                          {tenant.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => handleSuspend(tenant.id)}
                              className="text-orange-600"
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleReactivate(tenant.id)}
                              className="text-green-600"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(tenant.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Tenants</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple tenants at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Upload CSV File</label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-2"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>CSV should have columns: name, slug, contactEmail, city, totalRooms, plan</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkImportOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkImport}
                disabled={!selectedFile || bulkImportTenants.isPending}
              >
                {bulkImportTenants.isPending ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Details Drawer */}
      <TenantDrawer
        tenant={selectedTenant}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAction={handleTenantAction}
      />
    </motion.div>
  );
}