import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Bed,
  ClipboardList,
  Bell,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const ManagerDashboard = () => {
  // Mock data - replace with real API calls
  const operationalMetrics = {
    occupancyRate: 87,
    checkInsToday: 12,
    checkOutsToday: 8,
    pendingRequests: 15,
    pendingApprovals: 4,
    staffOnDuty: 24,
    revenueToday: 12450,
    revenueWeek: 89320,
    revenueMonth: 342890
  };

  const roomStatus = {
    occupied: 43,
    available: 7,
    outOfService: 2,
    maintenance: 1
  };

  const recentRequests = [
    { id: 1, room: '203', type: 'Housekeeping', request: 'Extra towels', time: '2 min ago', priority: 'low' },
    { id: 2, room: '156', type: 'Maintenance', request: 'AC not working', time: '5 min ago', priority: 'high' },
    { id: 3, room: '301', type: 'Room Service', request: 'Late checkout', time: '8 min ago', priority: 'medium' },
    { id: 4, room: '127', type: 'Concierge', request: 'Restaurant reservation', time: '12 min ago', priority: 'low' }
  ];

  const staffOnDuty = [
    { name: 'Sarah Johnson', role: 'Front Desk', status: 'active', tasks: 3 },
    { name: 'Mike Chen', role: 'Housekeeping Lead', status: 'active', tasks: 7 },
    { name: 'Emily Rodriguez', role: 'Maintenance', status: 'break', tasks: 2 },
    { name: 'David Kim', role: 'Restaurant', status: 'active', tasks: 4 }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'break': return 'secondary';
      case 'offline': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operations Overview</h1>
          <p className="text-muted-foreground">Real-time monitoring and control center</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Live Updates: ON
          </Button>
          <Button>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Mode
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operationalMetrics.occupancyRate}%</div>
              <Progress value={operationalMetrics.occupancyRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {roomStatus.occupied} of {roomStatus.occupied + roomStatus.available} rooms
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operationalMetrics.checkInsToday}</div>
              <p className="text-xs text-muted-foreground">
                {operationalMetrics.checkOutsToday} check-outs scheduled
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operationalMetrics.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting manager review
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operationalMetrics.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Across all departments
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Staff On Duty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operationalMetrics.staffOnDuty}</div>
              <p className="text-xs text-muted-foreground">
                All departments active
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Snapshot */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Snapshot
            </CardTitle>
            <CardDescription>Performance across time periods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Today</div>
                <div className="text-2xl font-bold text-green-600">
                  ${operationalMetrics.revenueToday.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">This Week</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${operationalMetrics.revenueWeek.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Month to Date</div>
                <div className="text-2xl font-bold text-purple-600">
                  ${operationalMetrics.revenueMonth.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Service Requests */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Service Requests
              </CardTitle>
              <CardDescription>Latest guest and operational requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Room {request.room}</span>
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{request.type}: {request.request}</div>
                      <div className="text-xs text-muted-foreground">{request.time}</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                View All Requests
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Staff Status */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff On Duty
              </CardTitle>
              <CardDescription>Current staff status and workload</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffOnDuty.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{staff.name}</span>
                        <Badge variant={getStatusColor(staff.status)}>
                          {staff.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{staff.role}</div>
                      <div className="text-xs text-muted-foreground">{staff.tasks} active tasks</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                View All Staff
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ManagerDashboard;