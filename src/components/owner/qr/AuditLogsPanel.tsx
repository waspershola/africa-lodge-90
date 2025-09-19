import React, { useState } from 'react';
import { FileText, Filter, Calendar, User, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditLog {
  id: string;
  qrId: string;
  service: string;
  action: 'created' | 'reissued' | 'disabled' | 'exported' | 'scanned';
  staff: string;
  timestamp: Date;
  details?: string;
}

export const AuditLogsPanel = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      qrId: 'QR_WIFI_001',
      service: 'Guest Wi-Fi',
      action: 'created',
      staff: 'John Manager',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      details: 'Global Wi-Fi QR code generated'
    },
    {
      id: '2',
      qrId: 'QR_RS_101',
      service: 'Room Service',
      action: 'created',
      staff: 'John Manager',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      details: 'Per-room QR codes generated for all rooms'
    },
    {
      id: '3',
      qrId: 'QR_RS_205',
      service: 'Room Service',
      action: 'scanned',
      staff: 'Guest (Room 205)',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      details: 'Guest requested extra towels'
    },
    {
      id: '4',
      qrId: 'QR_MAINTENANCE_101',
      service: 'Maintenance',
      action: 'created',
      staff: 'Sarah Supervisor',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      details: 'Maintenance request QR for Room 101'
    },
    {
      id: '5',
      qrId: 'QR_WIFI_001',
      service: 'Guest Wi-Fi',
      action: 'exported',
      staff: 'John Manager',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      details: 'Bulk export for lobby placement'
    },
    {
      id: '6',
      qrId: 'QR_MENU_001',
      service: 'Digital Menu',
      action: 'disabled',
      staff: 'John Manager',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      details: 'Menu service temporarily disabled'
    }
  ]);

  const getActionColor = (action: AuditLog['action']) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'scanned': return 'bg-blue-100 text-blue-800';
      case 'exported': return 'bg-purple-100 text-purple-800';
      case 'reissued': return 'bg-orange-100 text-orange-800';
      case 'disabled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: AuditLog['action']) => {
    switch (action) {
      case 'created': return '➕';
      case 'scanned': return '📱';
      case 'exported': return '📄';
      case 'reissued': return '🔄';
      case 'disabled': return '🚫';
      default: return '📋';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filter !== 'all' && log.action !== filter) return false;
    if (searchTerm && !log.service.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !log.staff.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit & Activity Logs
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="scanned">Scanned</SelectItem>
                  <SelectItem value="exported">Exported</SelectItem>
                  <SelectItem value="reissued">Reissued</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.qrId}</TableCell>
                  <TableCell className="font-medium">{log.service}</TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {getActionIcon(log.action)} {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {log.staff}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No audit logs found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};