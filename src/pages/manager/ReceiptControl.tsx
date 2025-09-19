import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Receipt, 
  Printer, 
  Eye, 
  Download, 
  Settings, 
  Shield,
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ReceiptControl = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const receiptTemplates = [
    {
      id: 'hotel-standard',
      name: 'Hotel Standard Receipt',
      department: 'Front Desk',
      paperSize: 'A4',
      status: 'active',
      lastModified: '2024-01-15',
      usage: 245
    },
    {
      id: 'restaurant-pos',
      name: 'Restaurant POS Receipt',
      department: 'Restaurant',
      paperSize: '80mm Thermal',
      status: 'active',
      lastModified: '2024-01-14',
      usage: 156
    },
    {
      id: 'bar-receipt',
      name: 'Bar Receipt Template',
      department: 'Bar',
      paperSize: '58mm Thermal',
      status: 'active',
      lastModified: '2024-01-13',
      usage: 89
    },
    {
      id: 'spa-service',
      name: 'Spa Service Receipt',
      department: 'Spa',
      paperSize: 'A5',
      status: 'draft',
      lastModified: '2024-01-12',
      usage: 23
    }
  ];

  const auditLogs = [
    {
      id: 1,
      receiptId: 'RCP-2024-001234',
      template: 'Hotel Standard Receipt',
      user: 'Sarah Johnson',
      department: 'Front Desk',
      action: 'Generated & Printed',
      timestamp: '2024-01-15 14:23:45',
      guest: 'John Smith - Room 203',
      amount: 15000,
      status: 'success'
    },
    {
      id: 2,
      receiptId: 'RCP-2024-001235',
      template: 'Restaurant POS Receipt',
      user: 'Mike Chen',
      department: 'Restaurant',
      action: 'Generated & Emailed',
      timestamp: '2024-01-15 14:15:22',
      guest: 'Maria Garcia',
      amount: 3500,
      status: 'success'
    },
    {
      id: 3,
      receiptId: 'RCP-2024-001236',
      template: 'Hotel Standard Receipt',
      user: 'David Wilson',
      department: 'Front Desk',
      action: 'Generation Failed',
      timestamp: '2024-01-15 13:45:11',
      guest: 'VIP Guest - Suite 301',
      amount: 85000,
      status: 'failed'
    },
    {
      id: 4,
      receiptId: 'RCP-2024-001237',
      template: 'Bar Receipt Template',
      user: 'Emily Rodriguez',
      department: 'Bar',
      action: 'Void Request',
      timestamp: '2024-01-15 12:33:18',
      guest: 'Lisa Thompson',
      amount: 2800,
      status: 'pending'
    }
  ];

  const approvalRequests = [
    {
      id: 1,
      type: 'Refund Receipt',
      amount: 15000,
      reason: 'AC Issue Compensation',
      requestedBy: 'Sarah Johnson',
      guest: 'John Smith - Room 203',
      timestamp: '30 minutes ago',
      urgency: 'high'
    },
    {
      id: 2,
      type: 'Discount Application',
      amount: 5000,
      reason: 'Corporate Rate Adjustment',
      requestedBy: 'Mike Chen',
      guest: 'Business Event Group',
      timestamp: '1 hour ago',
      urgency: 'medium'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'success': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
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
          <h1 className="text-3xl font-bold text-foreground">Receipt & Printing Control</h1>
          <p className="text-muted-foreground">Template management, audit logs, and approval workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Security Settings
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure Templates
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Receipt Templates</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Template Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Receipt Template Management
                </CardTitle>
                <CardDescription>Configure and manage receipt templates per department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {receiptTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.department}</p>
                        </div>
                        <Badge variant={getStatusColor(template.status)}>
                          {template.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Paper Size:</span>
                          <span className="font-medium">{template.paperSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Usage Count:</span>
                          <span className="font-medium">{template.usage} receipts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Modified:</span>
                          <span className="font-medium">{template.lastModified}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Audit Log Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="front-desk">Front Desk</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="spa">Spa</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Audit Logs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Receipt Generation Audit Log
                </CardTitle>
                <CardDescription>Complete history of all receipt generation activities</CardDescription>
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
                          <span className="font-medium">{log.receiptId}</span>
                          <Badge variant={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>Action:</strong> {log.action}</div>
                          <div><strong>Staff:</strong> {log.user} ({log.department})</div>
                          <div><strong>Guest:</strong> {log.guest}</div>
                          <div><strong>Amount:</strong> ₦{log.amount.toLocaleString()}</div>
                          <div><strong>Time:</strong> {log.timestamp}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          {/* Approval Queue */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Manager Approval Required
                </CardTitle>
                <CardDescription>
                  Refunds, voids, and special receipt requests requiring manager approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvalRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.type}</h3>
                            <Badge variant={getUrgencyColor(request.urgency)}>
                              {request.urgency} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.guest}</p>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          ₦{request.amount.toLocaleString()}
                        </div>
                      </div>

                      <div className="text-sm space-y-1 mb-4">
                        <div><strong>Reason:</strong> {request.reason}</div>
                        <div><strong>Requested by:</strong> {request.requestedBy}</div>
                        <div><strong>Time:</strong> {request.timestamp}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Deny
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {approvalRequests.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-green-600">All Clear!</h3>
                    <p className="text-muted-foreground">No pending approval requests at this time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Receipt Usage Analytics</CardTitle>
                <CardDescription>Receipt generation patterns and template performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics Dashboard Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Detailed receipt usage analytics, template performance, and compliance reports.
                  </p>
                  <Button>
                    View Usage Reports
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

export default ReceiptControl;