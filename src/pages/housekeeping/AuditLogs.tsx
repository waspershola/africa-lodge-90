import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock,
  User,
  MapPin,
  Search,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  Package,
  Wrench,
  FileText,
  Calendar,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: Date;
  staffMember: string;
  staffId: string;
  action: 'task_accepted' | 'task_completed' | 'task_declined' | 'task_reassigned' | 
         'amenity_delivered' | 'supply_used' | 'room_cleaned' | 'oos_reported' | 
         'oos_resolved' | 'shift_started' | 'shift_ended' | 'emergency_reported';
  targetType: 'room' | 'task' | 'supply' | 'amenity' | 'shift' | 'emergency';
  targetId: string;
  roomNumber?: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export default function HousekeepingAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('today');

  // Mock audit logs data
  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      staffMember: 'Maria Santos',
      staffId: 'staff-001',
      action: 'task_completed',
      targetType: 'task',
      targetId: 'task-301-cleaning',
      roomNumber: '301',
      description: 'Completed post-checkout cleaning for Room 301',
      oldValue: 'in-progress',
      newValue: 'completed',
      metadata: {
        taskType: 'cleaning',
        duration: 45,
        checklistCompleted: true,
        suppliesUsed: ['towels', 'cleaning_spray', 'vacuum']
      },
      ipAddress: '192.168.1.25',
      userAgent: 'Mozilla/5.0 (Mobile)',
      location: 'Floor 3 - Room 301'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 min ago
      staffMember: 'Sarah Johnson',
      staffId: 'staff-002',
      action: 'amenity_delivered',
      targetType: 'amenity',
      targetId: 'req-308-towels',
      roomNumber: '308',
      description: 'Delivered extra towels and baby cot to Room 308',
      metadata: {
        items: ['Extra Towels (x2)', 'Baby Cot'],
        requestSource: 'guest-qr',
        deliveryTime: 12
      },
      ipAddress: '192.168.1.26',
      userAgent: 'Mozilla/5.0 (Mobile)',
      location: 'Floor 3 - Room 308'
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
      staffMember: 'John Martinez',
      staffId: 'staff-003',
      action: 'supply_used',
      targetType: 'supply',
      targetId: 'supply-towels',
      roomNumber: '205',
      description: 'Used 4 bath towels for Room 205 cleaning',
      metadata: {
        supplyItem: 'Bath Towels',
        quantity: 4,
        remainingStock: 41,
        taskId: 'task-205-cleaning'
      },
      ipAddress: '192.168.1.27',
      userAgent: 'Mozilla/5.0 (Mobile)',
      location: 'Floor 2 - Room 205'
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      staffMember: 'Mike Wilson',
      staffId: 'maint-001',
      action: 'oos_reported',
      targetType: 'room',
      targetId: 'room-305',
      roomNumber: '305',
      description: 'Reported Room 305 as Out of Service due to AC failure',
      oldValue: 'available',
      newValue: 'oos-maintenance',
      metadata: {
        reason: 'Air Conditioning System Failure',
        priority: 'urgent',
        estimatedResolution: '2024-01-21T14:00:00Z'
      },
      ipAddress: '192.168.1.28',
      userAgent: 'Mozilla/5.0 (Desktop)',
      location: 'Floor 3 - Room 305'
    },
    {
      id: 'log-5',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      staffMember: 'Maria Santos',
      staffId: 'staff-001',
      action: 'shift_started',
      targetType: 'shift',
      targetId: 'shift-20250119-day',
      description: 'Started day shift - Housekeeping Department',
      metadata: {
        shiftType: 'day',
        scheduledHours: 8,
        assignedRooms: ['301', '302', '303', '304', '305']
      },
      ipAddress: '192.168.1.25',
      userAgent: 'Mozilla/5.0 (Mobile)',
      location: 'Staff Break Room'
    },
    {
      id: 'log-6',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      staffMember: 'Sarah Johnson',
      staffId: 'staff-002',
      action: 'task_declined',
      targetType: 'task',
      targetId: 'task-410-amenity',
      roomNumber: '410',
      description: 'Declined amenity delivery task for Room 410 - Item unavailable',
      oldValue: 'pending',
      newValue: 'declined',
      metadata: {
        reason: 'Pet bed not available in inventory',
        alternative: 'Offered blanket instead via phone call'
      },
      ipAddress: '192.168.1.26',
      userAgent: 'Mozilla/5.0 (Mobile)',
      location: 'Floor 4 - Room 410'
    }
  ];

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.staffMember.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.roomNumber && log.roomNumber.includes(searchTerm));
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStaff = filterStaff === 'all' || log.staffMember === filterStaff;
    
    // Date range filtering (simplified)
    const now = new Date();
    let matchesDate = true;
    if (filterDateRange === 'today') {
      matchesDate = log.timestamp.toDateString() === now.toDateString();
    } else if (filterDateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = log.timestamp >= weekAgo;
    } else if (filterDateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = log.timestamp >= monthAgo;
    }
    
    return matchesSearch && matchesAction && matchesStaff && matchesDate;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'task_completed':
      case 'amenity_delivered':
      case 'room_cleaned':
      case 'oos_resolved':
        return 'bg-success/10 text-success border-success/20';
      case 'task_accepted':
      case 'shift_started':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'task_declined':
      case 'emergency_reported':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'oos_reported':
        return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'supply_used':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'task_completed':
      case 'room_cleaned':
        return <CheckCircle className="h-4 w-4" />;
      case 'task_accepted':
        return <Activity className="h-4 w-4" />;
      case 'amenity_delivered':
        return <Package className="h-4 w-4" />;
      case 'supply_used':
        return <Package className="h-4 w-4" />;
      case 'oos_reported':
      case 'emergency_reported':
        return <AlertTriangle className="h-4 w-4" />;
      case 'shift_started':
      case 'shift_ended':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleExportLogs = () => {
    console.log('Exporting audit logs...');
    // Implementation for exporting logs as CSV/PDF
  };

  const uniqueStaffMembers = Array.from(new Set(auditLogs.map(log => log.staffMember)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Housekeeping Audit Logs</h1>
          <p className="text-muted-foreground">Track all housekeeping activities and staff actions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportLogs} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
                <div className="text-sm text-muted-foreground">Total Actions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {filteredLogs.filter(log => 
                    log.action === 'task_completed' || 
                    log.action === 'amenity_delivered' || 
                    log.action === 'room_cleaned'
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {filteredLogs.filter(log => 
                    log.action === 'oos_reported' || 
                    log.action === 'emergency_reported'
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Issues Reported</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{uniqueStaffMembers.length}</div>
                <div className="text-sm text-muted-foreground">Active Staff</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="task_completed">Task Completed</SelectItem>
                <SelectItem value="task_accepted">Task Accepted</SelectItem>
                <SelectItem value="amenity_delivered">Amenity Delivered</SelectItem>
                <SelectItem value="supply_used">Supply Used</SelectItem>
                <SelectItem value="oos_reported">OOS Reported</SelectItem>
                <SelectItem value="shift_started">Shift Started</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStaff} onValueChange={setFilterStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {uniqueStaffMembers.map((staff) => (
                  <SelectItem key={staff} value={staff}>{staff}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card className="luxury-card">
        <CardContent className="p-0">
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <Badge className={getActionColor(log.action)} variant="outline">
                      {formatActionName(log.action)}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{log.description}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.staffMember}</span>
                      </div>
                      {log.roomNumber && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>Room {log.roomNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(log.timestamp, 'MMM dd, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {log.metadata && (
                  <div className="text-xs text-muted-foreground max-w-xs">
                    {log.oldValue && log.newValue && (
                      <div>
                        {log.oldValue} → {log.newValue}
                      </div>
                    )}
                    {log.metadata.duration && (
                      <div>Duration: {log.metadata.duration}min</div>
                    )}
                    {log.metadata.items && (
                      <div className="truncate">Items: {log.metadata.items.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredLogs.length === 0 && (
        <Card className="luxury-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium mb-2">No audit logs found</div>
            <div className="text-muted-foreground">
              {searchTerm || filterAction !== 'all' || filterStaff !== 'all'
                ? 'Try adjusting your filters'
                : 'Activity logs will appear here as staff perform actions'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}