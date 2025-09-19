import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Operations = () => {
  const liveOperations = [
    { id: 1, activity: 'Guest Check-in', location: 'Front Desk', staff: 'Sarah J.', time: 'Just now', status: 'active' },
    { id: 2, activity: 'Room Cleaning', location: 'Room 203', staff: 'Mike C.', time: '2 min ago', status: 'completed' },
    { id: 3, activity: 'Maintenance Request', location: 'Room 156', staff: 'David K.', time: '5 min ago', status: 'in-progress' },
    { id: 4, activity: 'Restaurant Order', location: 'Main Restaurant', staff: 'Emily R.', time: '8 min ago', status: 'active' },
  ];

  const emergencyProtocols = [
    { name: 'Fire Emergency', status: 'ready', lastTested: '2 days ago' },
    { name: 'Medical Emergency', status: 'ready', lastTested: '1 week ago' },
    { name: 'Security Breach', status: 'ready', lastTested: '3 days ago' },
    { name: 'Power Outage', status: 'ready', lastTested: '5 days ago' }
  ];

  const departmentStatus = [
    { name: 'Front Desk', status: 'operational', staff: 3, tasks: 5 },
    { name: 'Housekeeping', status: 'operational', staff: 8, tasks: 12 },
    { name: 'Maintenance', status: 'alert', staff: 2, tasks: 7 },
    { name: 'Restaurant', status: 'operational', staff: 6, tasks: 3 },
    { name: 'Security', status: 'operational', staff: 2, tasks: 1 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'default';
      case 'alert': return 'destructive';
      case 'warning': return 'default';
      case 'active': return 'default';
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'ready': return 'default';
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
          <h1 className="text-3xl font-bold text-foreground">Live Operations</h1>
          <p className="text-muted-foreground">Real-time operational monitoring and control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            System Status: Normal
          </Button>
          <Button variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Override
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="live-feed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live-feed">Live Activity</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="communications">Comms</TabsTrigger>
        </TabsList>

        <TabsContent value="live-feed" className="space-y-6">
          {/* Live Activity Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>Real-time operational activities across all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveOperations.map((operation) => (
                    <motion.div
                      key={operation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg border-l-4 border-l-primary"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{operation.activity}</span>
                          <Badge variant={getStatusColor(operation.status)}>
                            {operation.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {operation.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {operation.staff}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {operation.time}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Monitor
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          {/* Department Status Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Department Status Overview
                </CardTitle>
                <CardDescription>Real-time status of all hotel departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departmentStatus.map((dept, index) => (
                    <motion.div
                      key={dept.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{dept.name}</h3>
                        <Badge variant={getStatusColor(dept.status)}>
                          {dept.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Staff on duty:</span>
                          <span className="font-medium">{dept.staff}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active tasks:</span>
                          <span className="font-medium">{dept.tasks}</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-3" variant="outline">
                        Manage Department
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          {/* Emergency Protocols */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Emergency Protocols
                </CardTitle>
                <CardDescription>Emergency response systems and protocols status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emergencyProtocols.map((protocol, index) => (
                    <motion.div
                      key={protocol.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted rounded-lg border-l-4 border-l-red-500"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{protocol.name}</h3>
                        <Badge variant={getStatusColor(protocol.status)}>
                          {protocol.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Last tested: {protocol.lastTested}
                      </p>
                      <Button size="sm" variant="destructive" className="w-full">
                        Activate Protocol
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">Emergency Contacts</h3>
                  <div className="space-y-1 text-sm text-red-700">
                    <div>Fire Department: 911</div>
                    <div>Medical Emergency: 911</div>
                    <div>Security: (555) 123-4567</div>
                    <div>Hotel Manager: (555) 987-6543</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          {/* Communication Center */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Communication Center
                </CardTitle>
                <CardDescription>Broadcast messages and staff communications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="h-20 flex-col">
                    <Phone className="h-6 w-6 mb-2" />
                    All-Staff Announcement
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Mail className="h-6 w-6 mb-2" />
                    Department Message
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    Emergency Alert
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Calendar className="h-6 w-6 mb-2" />
                    Shift Reminder
                  </Button>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">Recent Broadcasts</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm">Shift Change Reminder</div>
                      <div className="text-xs text-muted-foreground">Sent 2 hours ago to Housekeeping</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm">VIP Guest Arrival</div>
                      <div className="text-xs text-muted-foreground">Sent 4 hours ago to All Staff</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Operations;