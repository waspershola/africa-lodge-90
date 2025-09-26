import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MessageCircle, 
  CreditCard, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

export default function SupportAdminDashboard() {
  // Mock data - in real app, these would come from API calls
  const stats = {
    activeHotels: 42,
    openTickets: 8,
    monthlyRevenue: 2400000,
    pendingInvoices: 12,
    totalUsers: 328,
    avgResponseTime: '2.3h'
  };

  const recentTickets = [
    {
      id: 'TKT-001',
      title: 'Payment gateway integration issue',
      tenant: 'Azzara Hotel',
      priority: 'high',
      status: 'open',
      created: '2 hours ago'
    },
    {
      id: 'TKT-002', 
      title: 'Room type configuration help',
      tenant: 'Mountain View Lodge',
      priority: 'medium',
      status: 'in_progress',
      created: '4 hours ago'
    },
    {
      id: 'TKT-003',
      title: 'Billing discrepancy inquiry',
      tenant: 'Ocean View Resort',
      priority: 'low',
      status: 'waiting',
      created: '1 day ago'
    }
  ];

  const tenantHealth = [
    {
      name: 'Azzara Hotel',
      plan: 'Premium',
      status: 'healthy',
      occupancy: '85%',
      lastActive: '5 min ago'
    },
    {
      name: 'Mountain View Lodge',
      plan: 'Standard',
      status: 'warning',
      occupancy: '62%',
      lastActive: '1 hour ago'
    },
    {
      name: 'Ocean View Resort',
      plan: 'Premium',
      status: 'healthy',
      occupancy: '91%',
      lastActive: '2 min ago'
    }
  ];

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
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-amber-50/30 to-amber-100/20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Console</h1>
          <p className="text-muted-foreground">
            Global overview and support management
          </p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <MessageCircle className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Active Hotels</CardTitle>
            <Building2 className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.activeHotels}</div>
            <p className="text-xs text-amber-700">+2 new this month</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Open Tickets</CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.openTickets}</div>
            <p className="text-xs text-orange-700">Avg response: {stats.avgResponseTime}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₦{stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-700">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalUsers}</div>
            <p className="text-xs text-blue-700">Across all tenants</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-amber-600" />
              Recent Support Tickets
            </CardTitle>
            <CardDescription>Latest support requests from tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{ticket.id}</span>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">{ticket.tenant} • {ticket.created}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ticket.status === 'open' && <Clock className="h-4 w-4 text-orange-500" />}
                    {ticket.status === 'in_progress' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                    {ticket.status === 'waiting' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Tickets
            </Button>
          </CardContent>
        </Card>

        {/* Tenant Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              Tenant Health Overview
            </CardTitle>
            <CardDescription>Real-time status of hotel properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenantHealth.map((tenant, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{tenant.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {tenant.plan}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Occupancy: {tenant.occupancy}</span>
                      <span>Last active: {tenant.lastActive}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(tenant.status)}>
                    {tenant.status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {tenant.status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {tenant.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Tenants
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common support administration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="justify-start h-auto p-4">
              <Users className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Impersonate Tenant</div>
                <div className="text-xs text-muted-foreground">Access tenant dashboard</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <CreditCard className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Billing Overview</div>
                <div className="text-xs text-muted-foreground">Review payments & invoices</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <TrendingUp className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">System Reports</div>
                <div className="text-xs text-muted-foreground">Analytics & metrics</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}