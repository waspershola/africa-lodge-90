import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  User, 
  MapPin, 
  Filter, 
  CheckCircle, 
  AlertTriangle,
  Coffee,
  Wrench,
  Bed,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ServiceRequests = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const serviceRequests = [
    { 
      id: 1, 
      room: '203', 
      guest: 'John Smith', 
      type: 'Housekeeping', 
      request: 'Extra towels and pillows', 
      time: '2 min ago', 
      priority: 'low',
      status: 'pending',
      assignedTo: null,
      department: 'housekeeping'
    },
    { 
      id: 2, 
      room: '156', 
      guest: 'Maria Garcia', 
      type: 'Maintenance', 
      request: 'Air conditioning not working', 
      time: '15 min ago', 
      priority: 'high',
      status: 'assigned',
      assignedTo: 'Mike Chen',
      department: 'maintenance'
    },
    { 
      id: 3, 
      room: '301', 
      guest: 'David Wilson', 
      type: 'Room Service', 
      request: 'Late breakfast delivery', 
      time: '30 min ago', 
      priority: 'medium',
      status: 'in-progress',
      assignedTo: 'Sarah Johnson',
      department: 'restaurant'
    },
    { 
      id: 4, 
      room: '127', 
      guest: 'Lisa Chen', 
      type: 'Concierge', 
      request: 'Restaurant reservation for 8pm', 
      time: '45 min ago', 
      priority: 'low',
      status: 'completed',
      assignedTo: 'Emily Rodriguez',
      department: 'concierge'
    },
    { 
      id: 5, 
      room: '089', 
      guest: 'Robert Taylor', 
      type: 'Security', 
      request: 'Lost keycard replacement', 
      time: '1 hour ago', 
      priority: 'medium',
      status: 'pending',
      assignedTo: null,
      department: 'security'
    }
  ];

  const autoRoutingRules = [
    { trigger: 'AC issues', route: 'Maintenance Team A', priority: 'High' },
    { trigger: 'Housekeeping requests', route: 'Available Housekeeper', priority: 'Normal' },
    { trigger: 'Room service orders', route: 'Restaurant Queue', priority: 'Normal' },
    { trigger: 'Security issues', route: 'Security Team', priority: 'High' },
    { trigger: 'VIP guest requests', route: 'Manager Approval', priority: 'High' }
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
      case 'pending': return 'default';
      case 'assigned': return 'secondary';
      case 'in-progress': return 'default';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'housekeeping': return <Bed className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'restaurant': return <Coffee className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredRequests = serviceRequests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    const departmentMatch = filterDepartment === 'all' || request.department === filterDepartment;
    return statusMatch && departmentMatch;
  });

  const requestStats = {
    total: serviceRequests.length,
    pending: serviceRequests.filter(r => r.status === 'pending').length,
    assigned: serviceRequests.filter(r => r.status === 'assigned').length,
    inProgress: serviceRequests.filter(r => r.status === 'in-progress').length,
    completed: serviceRequests.filter(r => r.status === 'completed').length
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
          <h1 className="text-3xl font-bold text-foreground">Service Request Management</h1>
          <p className="text-muted-foreground">Unified QR system monitoring and task assignment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Auto-assign: ON
          </Button>
          <Button>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Escalate Priority
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{requestStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{requestStats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{requestStats.assigned}</div>
              <div className="text-sm text-muted-foreground">Assigned</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{requestStats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{requestStats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">Live Requests</TabsTrigger>
          <TabsTrigger value="routing">Auto-Routing</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="concierge">Concierge</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    Bulk Assign
                  </Button>
                  <Button variant="outline">
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Requests List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle>Active Service Requests</CardTitle>
                <CardDescription>Real-time feed from unified QR system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg border-l-4 border-l-primary"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getDepartmentIcon(request.department)}
                          <span className="font-medium">Room {request.room} - {request.guest}</span>
                          <Badge variant={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Badge variant={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          <strong>{request.type}:</strong> {request.request}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {request.time}
                          </span>
                          {request.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Assigned to {request.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            Assign Staff
                          </Button>
                        )}
                        {request.status === 'assigned' && (
                          <Button size="sm">
                            Mark In Progress
                          </Button>
                        )}
                        {request.status === 'in-progress' && (
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Details
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="routing" className="space-y-6">
          {/* Auto-Routing Rules */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Auto-Routing Configuration</CardTitle>
                <CardDescription>Configure automatic request assignment rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {autoRoutingRules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{rule.trigger}</div>
                        <div className="text-sm text-muted-foreground">
                          Routes to: <strong>{rule.route}</strong> | Priority: <strong>{rule.priority}</strong>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Disable</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  Add New Routing Rule
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Service request metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Performance metrics, response times, and trend analysis will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceRequests;