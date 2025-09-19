import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  Eye, 
  Clock, 
  User,
  Camera,
  Lock,
  Activity,
  Bell,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Compliance = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const incidentReports = [
    {
      id: 'INC-2024-001',
      type: 'Guest Complaint',
      title: 'Noise Complaint - Room 305',
      description: 'Guest reported excessive noise from adjacent room during late hours',
      reportedBy: 'Sarah Johnson',
      reportedAt: '2024-01-15 23:45:00',
      status: 'resolved',
      priority: 'medium',
      location: 'Floor 3',
      resolution: 'Moved guest to quieter room, compensated with room upgrade'
    },
    {
      id: 'INC-2024-002',
      type: 'Staff Misconduct',
      title: 'Inappropriate Behavior Report',
      description: 'Guest reported unprofessional conduct by housekeeping staff',
      reportedBy: 'Mike Chen',
      reportedAt: '2024-01-15 14:20:00',
      status: 'investigating',
      priority: 'high',
      location: 'Room 156',
      resolution: null
    },
    {
      id: 'INC-2024-003',
      type: 'Safety Incident',
      title: 'Slip and Fall in Lobby',
      description: 'Guest slipped on wet floor near reception area',
      reportedBy: 'Emily Rodriguez',
      reportedAt: '2024-01-15 09:30:00',
      status: 'closed',
      priority: 'high',
      location: 'Main Lobby',
      resolution: 'Medical attention provided, incident documentation completed, floor signage improved'
    },
    {
      id: 'INC-2024-004',
      type: 'Security Issue',
      title: 'Unauthorized Access Attempt',
      description: 'Attempted unauthorized access to restricted area',
      reportedBy: 'Security Team',
      reportedAt: '2024-01-14 22:15:00',
      status: 'resolved',
      priority: 'high',
      location: 'Service Elevator',
      resolution: 'Security protocols reviewed, access controls strengthened'
    }
  ];

  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-01-15 15:23:45',
      user: 'Sarah Johnson',
      action: 'QR Code Scan',
      resource: 'Room 203 - Service Request',
      ipAddress: '192.168.1.45',
      result: 'success',
      details: 'Housekeeping request for extra towels'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:58:12',
      user: 'Mike Chen',
      action: 'Receipt Generation',
      resource: 'Restaurant POS - Table 12',
      ipAddress: '192.168.1.67',
      result: 'success',
      details: 'Generated receipt RCP-2024-001235'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:45:33',
      user: 'Admin User',
      action: 'System Access',
      resource: 'Manager Dashboard',
      ipAddress: '192.168.1.100',
      result: 'failed',
      details: 'Invalid credentials - locked after 3 attempts'
    },
    {
      id: 4,
      timestamp: '2024-01-15 13:22:18',
      user: 'David Wilson',
      action: 'Room Access',
      resource: 'Digital Lock - Room 301',
      ipAddress: 'Physical Device',
      result: 'success',
      details: 'Maintenance access approved by system'
    }
  ];

  const securityMetrics = {
    totalIncidents: 4,
    openIncidents: 1,
    resolvedToday: 2,
    criticalAlerts: 0,
    systemUptime: 99.8,
    lastSecurityScan: '2 hours ago'
  };

  const surveillanceFeeds = [
    { id: 1, location: 'Main Lobby', status: 'active', lastActivity: '2 min ago' },
    { id: 2, location: 'Reception Area', status: 'active', lastActivity: '1 min ago' },
    { id: 3, location: 'Parking Garage', status: 'active', lastActivity: '5 min ago' },
    { id: 4, location: 'Service Entrance', status: 'maintenance', lastActivity: '1 hour ago' },
    { id: 5, location: 'Restaurant', status: 'active', lastActivity: '3 min ago' },
    { id: 6, location: 'Pool Area', status: 'active', lastActivity: '8 min ago' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'closed': return 'default';
      case 'investigating': return 'secondary';
      case 'open': return 'destructive';
      case 'success': return 'default';
      case 'failed': return 'destructive';
      case 'active': return 'default';
      case 'maintenance': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const filteredIncidents = incidentReports.filter(incident => {
    const typeMatch = filterType === 'all' || incident.type.toLowerCase().replace(' ', '-') === filterType;
    const searchMatch = searchTerm === '' || 
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance & Security</h1>
          <p className="text-muted-foreground">Incident management, audit trails, and security monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            View Cameras
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            New Incident Report
          </Button>
        </div>
      </motion.div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{securityMetrics.totalIncidents}</div>
              <div className="text-sm text-muted-foreground">Total Incidents</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{securityMetrics.openIncidents}</div>
              <div className="text-sm text-muted-foreground">Open Cases</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{securityMetrics.resolvedToday}</div>
              <div className="text-sm text-muted-foreground">Resolved Today</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{securityMetrics.criticalAlerts}</div>
              <div className="text-sm text-muted-foreground">Critical Alerts</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{securityMetrics.systemUptime}%</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                <CheckCircle className="h-8 w-8 mx-auto" />
              </div>
              <div className="text-sm text-muted-foreground">Security Status</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="surveillance">Surveillance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-6">
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search incidents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="guest-complaint">Guest Complaint</SelectItem>
                      <SelectItem value="staff-misconduct">Staff Misconduct</SelectItem>
                      <SelectItem value="safety-incident">Safety Incident</SelectItem>
                      <SelectItem value="security-issue">Security Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Incident Reports */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="space-y-4">
              {filteredIncidents.map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{incident.title}</h3>
                            <Badge variant={getStatusColor(incident.status)}>
                              {incident.status}
                            </Badge>
                            <Badge variant={getPriorityColor(incident.priority)}>
                              {incident.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{incident.id} - {incident.type}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm">{incident.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Reported by:</span>
                            <div className="font-medium">{incident.reportedBy}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <div className="font-medium">{incident.location}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reported at:</span>
                            <div className="font-medium">{incident.reportedAt}</div>
                          </div>
                        </div>

                        {incident.resolution && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-sm font-medium text-green-800 mb-1">Resolution:</div>
                            <div className="text-sm text-green-700">{incident.resolution}</div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {incident.status === 'investigating' && (
                            <Button size="sm" className="flex-1">
                              Update Status
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Audit Logs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Audit Logs
                </CardTitle>
                <CardDescription>Complete activity trail for compliance and security monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant={getStatusColor(log.result)}>
                            {log.result}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>User:</strong> {log.user}</div>
                          <div><strong>Resource:</strong> {log.resource}</div>
                          <div><strong>Details:</strong> {log.details}</div>
                          <div><strong>IP:</strong> {log.ipAddress} | <strong>Time:</strong> {log.timestamp}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="surveillance" className="space-y-6">
          {/* Surveillance Monitoring */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Surveillance System Status
                </CardTitle>
                <CardDescription>Real-time monitoring of security cameras and IoT sensors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {surveillanceFeeds.map((feed, index) => (
                    <motion.div
                      key={feed.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{feed.location}</h3>
                        <Badge variant={getStatusColor(feed.status)}>
                          {feed.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                          {feed.status === 'active' ? (
                            <Camera className="h-8 w-8 text-white" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-400" />
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Last activity: {feed.lastActivity}
                        </div>
                        
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Live Feed
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">📹 Surveillance Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                    <div>Active Cameras: <strong>5/6</strong></div>
                    <div>Recording Status: <strong>All Active</strong></div>
                    <div>Storage Capacity: <strong>78% Used</strong></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Compliance Dashboard</CardTitle>
                <CardDescription>Regulatory compliance status and documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Compliance Monitoring Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Regulatory compliance tracking, policy management, and documentation will be available here.
                  </p>
                  <Button>
                    View Compliance Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Compliance;