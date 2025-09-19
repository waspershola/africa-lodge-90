import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useTenantManagement } from '@/hooks/useTenantManagement';
import { Tenant, SubscriptionStatus } from '@/types/tenant';
import { CreateTenantDialog } from './CreateTenantDialog';
import { TenantDetailsDrawer } from './TenantDetailsDrawer';
import { TenantControlsDialog } from './TenantControlsDialog';

const getStatusColor = (status: SubscriptionStatus) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'trialing': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'expired': return 'bg-red-500/20 text-red-700 border-red-500/30';
    case 'suspended': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
    case 'canceled': return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

const getStatusIcon = (status: SubscriptionStatus) => {
  switch (status) {
    case 'active': return CheckCircle;
    case 'trialing': return Clock;
    case 'expired': return AlertTriangle;
    case 'suspended': return AlertTriangle;
    default: return Activity;
  }
};

export function TenantManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showTenantControls, setShowTenantControls] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { 
    tenants, 
    plans, 
    loading, 
    error,
    suspendTenant,
    extendTrial,
    changePlan,
    getTenantMetrics
  } = useTenantManagement();

  const [metrics, setMetrics] = useState({
    total_tenants: 0,
    active_subscriptions: 0,
    trial_tenants: 0,
    expired_tenants: 0,
    monthly_revenue: 0,
    churn_rate: 0
  });

  // Load metrics on component mount
  useState(() => {
    getTenantMetrics().then(setMetrics);
  });

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleTenantAction = async (action: string, tenant: Tenant) => {
    try {
      switch (action) {
        case 'suspend':
          await suspendTenant(tenant.tenant_id, 'Administrative suspension');
          break;
        case 'extend-trial':
        case 'suspend':
        case 'change-plan':
          setSelectedTenant(tenant);
          setShowTenantControls(true);
          break;
        case 'upgrade-pro':
          await changePlan(tenant.tenant_id, 'plan-pro');
          break;
        case 'view-details':
          setSelectedTenant(tenant);
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold display-heading text-gradient">Tenant Management</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage hotel subscriptions, trials, and billing
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Create Tenant
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_tenants}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +1 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Tenants</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.trial_tenants}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.trial_tenants} converting soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{metrics.monthly_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hotels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
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
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('trialing')}>
              Trialing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('expired')}>
              Expired
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>
              Suspended
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hotels ({filteredTenants.length})</CardTitle>
          <CardDescription>
            Manage hotel subscriptions and access controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTenants.map((tenant) => {
              const StatusIcon = getStatusIcon(tenant.subscription_status);
              const plan = plans.find(p => p.plan_id === tenant.plan_id);
              
              return (
                <div 
                  key={tenant.tenant_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{tenant.hotel_name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{plan?.name} Plan</p>
                      <p className="text-xs text-muted-foreground">
                        ₦{plan?.price.toLocaleString()}/month
                      </p>
                    </div>
                    
                    <Badge className={getStatusColor(tenant.subscription_status)}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {tenant.subscription_status}
                    </Badge>
                    
                    {tenant.is_trial_active && (
                      <Badge variant="outline" className="text-blue-600">
                        {tenant.days_remaining} days left
                      </Badge>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTenantAction('view-details', tenant)}>
                          View Details
                        </DropdownMenuItem>
                        
                        {tenant.subscription_status === 'trialing' && (
                          <DropdownMenuItem onClick={() => handleTenantAction('extend-trial', tenant)}>
                            Extend Trial (+7 days)
                          </DropdownMenuItem>
                        )}
                        
                        {tenant.subscription_status !== 'suspended' && (
                          <DropdownMenuItem onClick={() => handleTenantAction('suspend', tenant)}>
                            Suspend Tenant
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleTenantAction('upgrade-pro', tenant)}>
                          Upgrade to Pro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTenantDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        plans={plans}
      />
      
      {/* Tenant Controls Dialog */}
      <TenantControlsDialog
        open={showTenantControls}
        onOpenChange={setShowTenantControls}
        tenant={selectedTenant}
        onTenantUpdate={(updatedTenant) => {
          console.log('Tenant updated:', updatedTenant);
          setSelectedTenant(null);
          setShowTenantControls(false);
        }}
      />

      {selectedTenant && (
        <TenantDetailsDrawer
          tenant={selectedTenant}
          open={!!selectedTenant}
          onOpenChange={() => setSelectedTenant(null)}
          plans={plans}
        />
      )}
    </div>
  );
}