import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  Settings,
  Shield,
  CreditCard,
  Users
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id?: string;
  target_name?: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  tenant_id?: string;
}

const actionTypes = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'invite', label: 'Invite' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'reset_password', label: 'Password Reset' },
  { value: 'plan_change', label: 'Plan Change' }
];

const roleTypes = [
  { value: 'all', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'STAFF', label: 'Staff' }
];

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  // Mock audit log data
  useEffect(() => {
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: '2025-09-19T10:30:00Z',
        actor_id: 'sa-001',
        actor_name: 'Super Admin',
        actor_role: 'SUPER_ADMIN',
        action: 'suspend',
        target_type: 'tenant',
        target_id: 'tenant-123',
        target_name: 'Grand Hotel Lagos',
        details: 'Tenant suspended due to payment failure',
        ip_address: '192.168.1.1',
        tenant_id: 'tenant-123'
      },
      {
        id: '2',
        timestamp: '2025-09-19T09:15:00Z',
        actor_id: 'owner-001',
        actor_name: 'John Owner',
        actor_role: 'OWNER',
        action: 'invite',
        target_type: 'staff',
        target_name: 'New Manager',
        details: 'Invited new manager with MANAGER role',
        ip_address: '10.0.0.15',
        tenant_id: 'tenant-456'
      },
      {
        id: '3',
        timestamp: '2025-09-19T08:45:00Z',
        actor_id: 'sa-001',
        actor_name: 'Super Admin',
        actor_role: 'SUPER_ADMIN',
        action: 'plan_change',
        target_type: 'tenant',
        target_id: 'tenant-789',
        target_name: 'Luxury Resort Abuja',
        details: 'Changed plan from Growth to Professional',
        ip_address: '192.168.1.1'
      },
      {
        id: '4',
        timestamp: '2025-09-18T16:20:00Z',
        actor_id: 'owner-002',
        actor_name: 'Sarah Owner',
        actor_role: 'OWNER',
        action: 'reset_password',
        target_type: 'staff',
        target_name: 'Front Desk Staff',
        details: 'Generated temporary password for staff member',
        ip_address: '172.16.0.5',
        tenant_id: 'tenant-456'
      },
      {
        id: '5',
        timestamp: '2025-09-18T14:30:00Z',
        actor_id: 'manager-001',
        actor_name: 'Mike Manager',
        actor_role: 'MANAGER',
        action: 'update',
        target_type: 'room_rate',
        target_name: 'Deluxe Room Rate',
        details: 'Updated room rate from $150 to $175 per night',
        ip_address: '10.0.1.20',
        tenant_id: 'tenant-456'
      }
    ];

    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target_name && log.target_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesRole = selectedRole === 'all' || log.actor_role === selectedRole;
    
    return matchesSearch && matchesAction && matchesRole;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-success/10 text-success border-success/20';
      case 'update': return 'bg-primary/10 text-primary border-primary/20';
      case 'delete': return 'bg-danger/10 text-danger border-danger/20';
      case 'suspend': return 'bg-warning/10 text-warning border-warning/20';
      case 'login': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'logout': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'invite': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'reset_password': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'plan_change': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'OWNER': return 'bg-primary/10 text-primary border-primary/20';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'STAFF': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'invite': return <Users className="h-4 w-4" />;
      case 'reset_password': return <Shield className="h-4 w-4" />;
      case 'plan_change': return <CreditCard className="h-4 w-4" />;
      case 'suspend': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleExport = () => {
    // In production, this would export to CSV/Excel
    const csvData = filteredLogs.map(log => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Actor: log.actor_name,
      Role: log.actor_role,
      Action: log.action,
      Target: log.target_name || log.target_type,
      Details: log.details
    }));
    
    console.log('Exporting audit logs:', csvData);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Track all system activities and user actions across your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleTypes.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {logs.length} logs
            </p>
            <Badge variant="outline">
              Last 7 days
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card>
        <CardContent className="p-0">
          {filteredLogs.length > 0 ? (
            <div className="divide-y">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted/50">
                        {getActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getRoleColor(log.actor_role)}>
                            {log.actor_role}
                          </Badge>
                          <span className="font-medium">{log.actor_name}</span>
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          {log.target_name && (
                            <span className="text-sm text-muted-foreground">
                              → {log.target_name}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm">{log.details}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          {log.ip_address && (
                            <div className="flex items-center gap-1">
                              <span>IP: {log.ip_address}</span>
                            </div>
                          )}
                          {log.tenant_id && (
                            <div className="flex items-center gap-1">
                              <span>Tenant: {log.tenant_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No audit logs found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search filters or date range
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}