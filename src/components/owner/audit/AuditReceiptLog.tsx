import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { DateRangePicker } from "@/components/ui/date-range-picker";
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Eye,
  Printer,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  receiptId: string;
  receiptType: 'check-in-slip' | 'receipt' | 'invoice';
  action: 'generated' | 'printed' | 'emailed' | 'downloaded' | 'viewed';
  staffName: string;
  staffId: string;
  department: string;
  guestName: string;
  roomNumber: string;
  amount?: number;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  ipAddress: string;
  userAgent?: string;
  notes?: string;
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    receiptId: 'CHK-201-1731834567',
    receiptType: 'check-in-slip',
    action: 'printed',
    staffName: 'Sarah Johnson',
    staffId: 'FD001',
    department: 'Front Desk',
    guestName: 'John Doe',
    roomNumber: '201',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'success',
    ipAddress: '192.168.1.10',
    notes: 'Guest requested printed check-in slip'
  },
  {
    id: '2',
    receiptId: 'RCP-1731834568',
    receiptType: 'receipt',
    action: 'generated',
    staffName: 'Mike Wilson',
    staffId: 'RS001',
    department: 'Restaurant',
    guestName: 'Jane Smith',
    roomNumber: '305',
    amount: 12500,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'success',
    ipAddress: '192.168.1.15',
  },
  {
    id: '3',
    receiptId: 'RCP-1731834569',
    receiptType: 'receipt',
    action: 'emailed',
    staffName: 'Sarah Johnson',
    staffId: 'FD001',
    department: 'Front Desk',
    guestName: 'Jane Smith',
    roomNumber: '305',
    amount: 12500,
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    status: 'failed',
    ipAddress: '192.168.1.10',
    notes: 'Email delivery failed - invalid email address'
  },
  {
    id: '4',
    receiptId: 'INV-102-20250101',
    receiptType: 'invoice',
    action: 'downloaded',
    staffName: 'David Chen',
    staffId: 'FD002',
    department: 'Front Desk',
    guestName: 'Michael Johnson',
    roomNumber: '102',
    amount: 45000,
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'success',
    ipAddress: '192.168.1.12',
  }
];

export function AuditReceiptLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  // const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const departments = [
    { value: 'Front Desk', label: 'Front Desk' },
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Spa', label: 'Spa & Wellness' },
    { value: 'Housekeeping', label: 'Housekeeping' },
  ];

  const actions = [
    { value: 'generated', label: 'Generated' },
    { value: 'printed', label: 'Printed' },
    { value: 'emailed', label: 'Emailed' },
    { value: 'downloaded', label: 'Downloaded' },
    { value: 'viewed', label: 'Viewed' },
  ];

  const statuses = [
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' },
  ];

  const receiptTypes = [
    { value: 'check-in-slip', label: 'Check-in Slip' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'invoice', label: 'Invoice' },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.receiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.roomNumber.includes(searchQuery);

    const matchesDepartment = !filterDepartment || log.department === filterDepartment;
    const matchesAction = !filterAction || log.action === filterAction;
    const matchesStatus = !filterStatus || log.status === filterStatus;

    const matchesDateRange = true; // !dateRange || (new Date(log.timestamp) >= dateRange.from && new Date(log.timestamp) <= dateRange.to);

    return matchesSearch && matchesDepartment && matchesAction && matchesStatus && matchesDateRange;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-danger" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-success">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'generated':
        return <FileText className="h-4 w-4" />;
      case 'printed':
        return <Printer className="h-4 w-4" />;
      case 'emailed':
        return <Mail className="h-4 w-4" />;
      case 'downloaded':
        return <Download className="h-4 w-4" />;
      case 'viewed':
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const exportLogs = () => {
    // Simulate export functionality
    const csvContent = [
      'Timestamp,Receipt ID,Type,Action,Staff,Department,Guest,Room,Amount,Status,IP Address,Notes',
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.receiptId,
        log.receiptType,
        log.action,
        log.staffName,
        log.department,
        log.guestName,
        log.roomNumber,
        log.amount || '',
        log.status,
        log.ipAddress,
        log.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `receipt-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Receipt Audit Log</h3>
          <p className="text-sm text-muted-foreground">
            Track all receipt and slip printing activities
          </p>
        </div>
        <Button onClick={exportLogs} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Log
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">Date Range Coming Soon</div>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilterDepartment("");
                setFilterAction("");
                setFilterStatus("");
                // setDateRange(undefined);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold">
                  {filteredLogs.filter(log => log.status === 'success').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-danger" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">
                  {filteredLogs.filter(log => log.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {filteredLogs.filter(log => log.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{log.receiptId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {receiptTypes.find(t => t.value === log.receiptType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="capitalize">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{log.staffName}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.department}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.guestName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.roomNumber}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.amount ? `₦${log.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48 truncate text-sm text-muted-foreground">
                        {log.notes || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No audit log entries found</p>
              <p className="text-sm text-muted-foreground">
                Adjust your filters to see more results
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}