import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Search, 
  LogIn, 
  LogOut, 
  QrCode, 
  CreditCard,
  User,
  Clock,
  AlertTriangle,
  Download,
  Filter
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  roomNumber: string;
  action: 'check-in' | 'check-out' | 'qr-assigned' | 'qr-disabled' | 'payment-collected' | 'service-request' | 'qr-scanned' | 'bill-adjustment';
  staff: string;
  timestamp: Date;
  guestName?: string;
  details?: string;
  qrCodeId?: string;
  amount?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    roomNumber: '305',
    action: 'qr-scanned',
    staff: 'System',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    guestName: 'Sarah Johnson',
    details: 'QR code scanned - Room service request',
    qrCodeId: 'QR_305',
    riskLevel: 'low'
  },
  {
    id: '2',
    roomNumber: '201',
    action: 'payment-collected',
    staff: 'Front Desk Staff',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    guestName: 'Mike Chen',
    details: 'Cash payment collected for room service',
    amount: 15000,
    riskLevel: 'low'
  },
  {
    id: '3',
    roomNumber: '410',
    action: 'check-in',
    staff: 'Front Desk Staff',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    guestName: 'David Wilson',
    details: 'Guest checked in, QR code activated with 4 services',
    qrCodeId: 'QR_410',
    riskLevel: 'low'
  },
  {
    id: '4',
    roomNumber: '150',
    action: 'qr-scanned',
    staff: 'System',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    guestName: 'Unknown',
    details: 'QR code scanned after guest checkout - SECURITY ALERT',
    qrCodeId: 'QR_150',
    riskLevel: 'high'
  },
  {
    id: '5',
    roomNumber: '301',
    action: 'bill-adjustment',
    staff: 'Manager',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    guestName: 'Sarah Johnson',
    details: 'Manual adjustment: Removed duplicate charges',
    amount: -5000,
    riskLevel: 'medium'
  },
  {
    id: '6',
    roomNumber: '102',
    action: 'check-out',
    staff: 'Front Desk Staff',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    guestName: 'John Doe',
    details: 'Guest checked out, QR code disabled',
    qrCodeId: 'QR_102',
    riskLevel: 'low'
  }
];

export const AuditTrailPanel = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('recent');

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'check-in': return <LogIn className="h-4 w-4 text-green-600" />;
      case 'check-out': return <LogOut className="h-4 w-4 text-blue-600" />;
      case 'qr-scanned': 
      case 'qr-assigned': 
      case 'qr-disabled': return <QrCode className="h-4 w-4 text-purple-600" />;
      case 'payment-collected': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'service-request': return <User className="h-4 w-4 text-blue-600" />;
      case 'bill-adjustment': return <CreditCard className="h-4 w-4 text-orange-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskColor = (risk: AuditLogEntry['riskLevel']) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionColor = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'check-in': 
      case 'payment-collected': return 'bg-green-100 text-green-800';
      case 'check-out':
      case 'qr-disabled': return 'bg-blue-100 text-blue-800';
      case 'qr-scanned':
      case 'qr-assigned': return 'bg-purple-100 text-purple-800';
      case 'bill-adjustment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.roomNumber.includes(searchTerm) ||
      log.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesRisk = riskFilter === 'all' || log.riskLevel === riskFilter;
    
    return matchesSearch && matchesAction && matchesRisk;
  });

  const securityAlerts = logs.filter(log => log.riskLevel === 'high');
  const recentActivity = logs.filter(log => 
    Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000
  );

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{securityAlerts.length}</div>
            <div className="text-sm text-red-700">Security Alerts</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{recentActivity.length}</div>
            <div className="text-sm text-blue-700">Recent Activity</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {logs.filter(l => l.action.startsWith('qr')).length}
            </div>
            <div className="text-sm text-purple-700">QR Activities</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.action === 'payment-collected').length}
            </div>
            <div className="text-sm text-green-700">Payments</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room, guest, staff, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="check-in">Check-In</SelectItem>
                <SelectItem value="check-out">Check-Out</SelectItem>
                <SelectItem value="qr-scanned">QR Scanned</SelectItem>
                <SelectItem value="payment-collected">Payment</SelectItem>
                <SelectItem value="bill-adjustment">Bill Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent Activity ({recentActivity.length})</TabsTrigger>
          <TabsTrigger value="security">Security Alerts ({securityAlerts.length})</TabsTrigger>
          <TabsTrigger value="all">All Logs ({filteredLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {recentActivity.slice(0, 20).map((log) => (
            <Card key={log.id} className={log.riskLevel === 'high' ? 'border-red-200 bg-red-50/20' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionIcon(log.action)}
                      <Badge className={getActionColor(log.action)}>
                        {log.action.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline">Room {log.roomNumber}</Badge>
                      <Badge className={getRiskColor(log.riskLevel)}>
                        {log.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="mb-2">
                      {log.guestName && (
                        <h3 className="font-medium">{log.guestName}</h3>
                      )}
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.staff}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(log.timestamp)}
                      </span>
                      {log.qrCodeId && (
                        <span>QR: {log.qrCodeId}</span>
                      )}
                      {log.amount && (
                        <span className={log.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {log.amount > 0 ? '+' : ''}₦{Math.abs(log.amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {securityAlerts.length > 0 ? (
            securityAlerts.map((log) => (
              <Card key={log.id} className="border-red-200 bg-red-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-red-100 text-red-800">SECURITY ALERT</Badge>
                        <Badge variant="outline">Room {log.roomNumber}</Badge>
                      </div>
                      <h3 className="font-medium mb-1">{log.details}</h3>
                      <div className="text-sm text-muted-foreground">
                        {log.staff} • {log.timestamp.toLocaleString()}
                        {log.qrCodeId && ` • QR: ${log.qrCodeId}`}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Investigate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-medium mb-2 text-green-800">All Clear</h3>
                <p className="text-muted-foreground">No security alerts at this time</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id} className={log.riskLevel === 'high' ? 'border-red-200 bg-red-50/20' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionIcon(log.action)}
                      <Badge className={getActionColor(log.action)}>
                        {log.action.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline">Room {log.roomNumber}</Badge>
                      <Badge className={getRiskColor(log.riskLevel)}>
                        {log.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="mb-2">
                      {log.guestName && (
                        <h3 className="font-medium">{log.guestName}</h3>
                      )}
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.staff}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.timestamp.toLocaleString()}
                      </span>
                      {log.qrCodeId && (
                        <span>QR: {log.qrCodeId}</span>
                      )}
                      {log.amount && (
                        <span className={log.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {log.amount > 0 ? '+' : ''}₦{Math.abs(log.amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredLogs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Results</h3>
                <p className="text-muted-foreground">
                  No audit logs found matching your search criteria
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};