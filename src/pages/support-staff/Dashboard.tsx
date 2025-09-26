import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MessageCircle, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useGlobalStats, useGlobalTickets, useTenantHealth } from '@/hooks/useSupportData';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupportStaffDashboard() {
  const { data: stats, isLoading: statsLoading } = useGlobalStats();
  const { data: tickets, isLoading: ticketsLoading } = useGlobalTickets(5);
  const { data: tenants, isLoading: tenantsLoading } = useTenantHealth(6);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'trialing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/30 to-blue-100/20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Portal</h1>
          <p className="text-muted-foreground">
            Read-only overview of platform status and tenants
          </p>
        </div>
        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
          <Eye className="w-4 h-4 mr-2" />
          Read-Only Access
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-900">{stats?.totalTenants || 0}</div>
            )}
            <p className="text-xs text-blue-700">Active properties</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Active Tenants</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-900">{stats?.activeTenants || 0}</div>
            )}
            <p className="text-xs text-green-700">Currently operational</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Open Tickets</CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-900">{stats?.openTickets || 0}</div>
            )}
            <p className="text-xs text-orange-700">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-purple-900">{stats?.totalUsers || 0}</div>
            )}
            <p className="text-xs text-purple-700">Platform-wide</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Recent Support Tickets
            </CardTitle>
            <CardDescription>Latest support requests from tenants</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {tickets?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No support tickets yet</p>
                  </div>
                ) : (
                  tickets?.map((ticket) => (
                    <div key={ticket.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{ticket.ticket_number}</span>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground font-medium truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.tenants?.hotel_name || 'Unknown Hotel'} • {formatTimeAgo(ticket.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket.status === 'open' && <Clock className="h-4 w-4 text-orange-500" />}
                        {ticket.status === 'in_progress' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                        {ticket.status === 'resolved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" disabled>
              View All Tickets (Read-Only)
            </Button>
          </CardContent>
        </Card>

        {/* Tenant Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Tenant Status Overview
            </CardTitle>
            <CardDescription>Current status of hotel properties</CardDescription>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {tenants?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No tenants found</p>
                  </div>
                ) : (
                  tenants?.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{tenant.hotel_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {tenant.plans?.name || 'Unknown Plan'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Last activity: {formatTimeAgo(tenant.updated_at)}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(tenant.subscription_status || 'active')}>
                        {tenant.subscription_status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {tenant.subscription_status === 'trialing' && <Clock className="w-3 h-3 mr-1" />}
                        {tenant.subscription_status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {tenant.subscription_status || 'active'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" disabled>
              View All Tenants (Read-Only)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Information Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Read-Only Access</h3>
              <p className="text-sm text-blue-700">
                You have read-only access to support data. For administrative actions like creating tickets 
                or managing tenants, please contact a Support Administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}