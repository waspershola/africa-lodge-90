import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Wrench, 
  Calendar,
  Package,
  Users,
  FileText,
  Zap,
  Shield,
  Hammer
} from 'lucide-react';
import { useMaintenanceApi } from '@/hooks/useMaintenanceApi';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

export default function MaintenanceDashboard() {
  const { workOrders, stats, isLoading, refreshWorkOrders } = useMaintenanceApi();
  const { toast } = useToast();
  
  // Mock data for missing features that will be implemented later
  const preventiveTasks: any[] = [];
  const supplies: any[] = [];
  const [activeShift, setActiveShift] = useState(false);

  // Enable real-time updates for maintenance
  useRealtimeUpdates([
    {
      table: 'work_orders',
      event: '*',
      onUpdate: (payload) => {
        if (payload.eventType === 'INSERT') {
          toast({
            title: "New Work Order",
            description: `${payload.new.title} - ${payload.new.priority} priority`,
            variant: payload.new.priority === 'critical' ? 'destructive' : 'default'
          });
        } else if (payload.eventType === 'UPDATE') {
          toast({
            title: "Work Order Updated",
            description: `${payload.new.title} - ${payload.new.status}`,
          });
        }
        refreshWorkOrders();
      },
      enabled: true
    }
  ]);

  // Get critical alerts
  const criticalWorkOrders = workOrders.filter(wo => wo.priority === 'critical' && wo.status !== 'completed');
  const lowStockSupplies: any[] = []; // Mock for now
  const overdueTasks: any[] = []; // Mock for now

  const handleStartShift = () => {
    setActiveShift(true);
    // In production, this would log the shift start time
  };

  const handleEndShift = () => {
    setActiveShift(false);
    // In production, this would log the shift end time
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'blue';
      case 'pending': return 'secondary';
      case 'escalated': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage work orders, preventive maintenance, and facility issues
          </p>
        </div>
        <div className="flex gap-2">
          {!activeShift ? (
            <Button onClick={handleStartShift} className="bg-green-600 hover:bg-green-700">
              <Clock className="h-4 w-4 mr-2" />
              Start Shift
            </Button>
          ) : (
            <Button onClick={handleEndShift} variant="destructive">
              <Clock className="h-4 w-4 mr-2" />
              End Shift
            </Button>
          )}
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Create Work Order
          </Button>
          <Button variant="outline">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Shift Status */}
      {activeShift && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Shift Active</span>
              <span className="text-green-600 text-sm">
                Started at {new Date().toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts */}
      {(criticalWorkOrders.length > 0 || lowStockSupplies.length > 0 || overdueTasks.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Priority Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalWorkOrders.map(wo => (
              <div key={wo.id} className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-l-red-500">
                <div>
                  <p className="font-medium text-red-700">🚨 {wo.issue}</p>
                  <p className="text-sm text-red-600">
                    {wo.roomId ? `Room ${wo.roomId}` : 'General'} • {wo.workOrderNumber}
                  </p>
                </div>
                <Badge variant="destructive">Critical</Badge>
              </div>
            ))}
            {lowStockSupplies.slice(0, 2).map(supply => (
              <div key={supply.id} className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-l-orange-500">
                <div>
                  <p className="font-medium text-orange-700">📦 Low Stock: {supply.name}</p>
                  <p className="text-sm text-orange-600">
                    {supply.currentStock} {supply.unit} remaining (Min: {supply.minThreshold})
                  </p>
                </div>
                <Badge className="bg-orange-100 text-orange-700">Low Stock</Badge>
              </div>
            ))}
            {overdueTasks.slice(0, 1).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-l-yellow-500">
                <div>
                  <p className="font-medium text-yellow-700">⏰ Overdue: {task.title}</p>
                  <p className="text-sm text-yellow-600">{task.location}</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700">Overdue</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold">{stats.openIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingCritical} critical priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg {stats.averageResolutionTime}min resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Housekeeping Escalations</p>
                <p className="text-2xl font-bold text-blue-600">{stats.escalationsFromHousekeeping || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-600">{stats.suppliesLowStock || 0}</p>
              </div>
              <Package className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Recent Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {workOrders.slice(0, 8).map(wo => (
                  <div key={wo.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getPriorityColor(wo.priority) as any} className="text-xs">
                          {wo.priority}
                        </Badge>
                        <span className="text-sm font-medium">{wo.workOrderNumber}</span>
                      </div>
                      <p className="font-medium">{wo.issue}</p>
                      <p className="text-sm text-muted-foreground">
                        {wo.roomId ? `Room ${wo.roomId}` : 'General'} • 
                        {wo.assignedTo ? ` Assigned to ${wo.assignedTo}` : ' Unassigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(wo.status) as any} className="mb-1">
                        {wo.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {wo.estimatedTime || 0}min ETA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Facility Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Facility Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* HVAC Systems */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700">HVAC Systems</span>
                </div>
                <Progress value={95} className="mb-2" />
                <p className="text-sm text-green-600">95% Operational</p>
              </div>

              {/* Electrical */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Electrical</span>
                </div>
                <Progress value={98} className="mb-2" />
                <p className="text-sm text-blue-600">98% Operational</p>
              </div>

              {/* Plumbing */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Hammer className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-700">Plumbing</span>
                </div>
                <Progress value={87} className="mb-2" />
                <p className="text-sm text-amber-600">87% Operational</p>
              </div>

              {/* Safety Systems */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700">Safety Systems</span>
                </div>
                <Progress value={100} className="mb-2" />
                <p className="text-sm text-green-600">100% Operational</p>
              </div>
            </div>

            {/* Preventive Maintenance Schedule */}
            <div className="mt-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Preventive Tasks
              </h4>
              <div className="space-y-2">
                {preventiveTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.location}</p>
                    </div>
                    <Badge variant={task.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {task.status === 'overdue' ? 'Overdue' : new Date(task.nextDue).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}