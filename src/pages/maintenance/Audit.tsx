import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Calendar,
  User,
  FileText,
  Clock,
  MapPin,
  Wrench,
  Package,
  AlertTriangle
} from 'lucide-react';

// Mock audit logs data
const mockAuditLogs = [
  {
    id: 'log-001',
    timestamp: '2024-01-19T12:10:00Z',
    staffId: 'staff-001',
    staffName: 'Mike Anderson',
    action: 'Completed Work Order',
    workOrderId: 'WO205-01',
    roomId: '205',
    details: 'AC filter replaced - Replaced worn filter, tested cooling system',
    category: 'work-order'
  },
  {
    id: 'log-002',
    timestamp: '2024-01-19T11:45:00Z',
    staffId: 'staff-002',
    staffName: 'John Martinez',
    action: 'Supply Usage',
    workOrderId: 'WO308-02',
    roomId: '308',
    details: 'Used: 1x Shower Valve Washer ($5.50)',
    category: 'supply'
  },
  {
    id: 'log-003',
    timestamp: '2024-01-19T11:20:00Z',
    staffId: 'system',
    staffName: 'System',
    action: 'QR Request Logged',
    roomId: '310',
    details: 'Guest reported: Light not working - Escalated to maintenance',
    category: 'escalation'
  },
  {
    id: 'log-004',
    timestamp: '2024-01-19T10:30:00Z',
    staffId: 'staff-001',
    staffName: 'Mike Anderson',
    action: 'Accepted Work Order',
    workOrderId: 'WO205-01',
    roomId: '205',
    details: 'Work order accepted and started - AC not cooling issue',
    category: 'work-order'
  },
  {
    id: 'log-005',
    timestamp: '2024-01-19T10:15:00Z',
    staffId: 'staff-003',
    staffName: 'Sarah Johnson',
    action: 'Created Work Order',
    workOrderId: 'WO-POOL-07',
    facility: 'Swimming Pool',
    details: 'Manual work order created - Pool pump making unusual noise',
    category: 'work-order'
  },
  {
    id: 'log-006',
    timestamp: '2024-01-19T09:45:00Z',
    staffId: 'staff-002',
    staffName: 'John Martinez',
    action: 'Preventive Task Completed',
    facility: 'Generator Room',
    details: 'Monthly generator test completed - All systems normal',
    category: 'preventive'
  }
];

export default function MaintenanceAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.roomId && log.roomId.includes(searchTerm)) ||
      (log.facility && log.facility.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesStaff = staffFilter === 'all' || log.staffId === staffFilter;

    return matchesSearch && matchesCategory && matchesStaff;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work-order': return Wrench;
      case 'supply': return Package;
      case 'preventive': return Calendar;
      case 'escalation': return AlertTriangle;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work-order': return 'blue';
      case 'supply': return 'green';
      case 'preventive': return 'purple';
      case 'escalation': return 'orange';
      default: return 'secondary';
    }
  };

  const uniqueStaff = [...new Set(mockAuditLogs.map(log => ({ id: log.staffId, name: log.staffName })))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all maintenance actions and changes for accountability
          </p>
        </div>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{mockAuditLogs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Work Orders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockAuditLogs.filter(l => l.category === 'work-order').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supply Usage</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockAuditLogs.filter(l => l.category === 'supply').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escalations</p>
                <p className="text-2xl font-bold text-orange-600">
                  {mockAuditLogs.filter(l => l.category === 'escalation').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="work-order">Work Orders</SelectItem>
            <SelectItem value="supply">Supply Usage</SelectItem>
            <SelectItem value="preventive">Preventive</SelectItem>
            <SelectItem value="escalation">Escalations</SelectItem>
          </SelectContent>
        </Select>
        <Select value={staffFilter} onValueChange={setStaffFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {uniqueStaff.map(staff => (
              <SelectItem key={staff.id} value={staff.id}>
                {staff.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredLogs.map(log => {
                const CategoryIcon = getCategoryIcon(log.category);
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-lg bg-${getCategoryColor(log.category)}-50`}>
                      <CategoryIcon className={`h-4 w-4 text-${getCategoryColor(log.category)}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getCategoryColor(log.category) as any}>
                          {log.category.replace('-', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">{log.action}</span>
                        {log.workOrderId && (
                          <Badge variant="outline" className="text-xs">
                            {log.workOrderId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{log.details}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.staffName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {(log.roomId || log.facility) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {log.roomId ? `Room ${log.roomId}` : log.facility}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}