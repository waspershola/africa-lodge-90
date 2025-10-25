// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Download, Filter, Calendar, User, Shield, 
  Activity, Eye, FileText, Crown, AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { DataEmpty } from '@/components/ui/data-empty';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  description: string;
  actor_email?: string;
  actor_role?: string;
  tenant_id?: string;
  metadata?: any;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function AuditViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 50;

  // Load audit logs with filters and pagination
  const loadAuditLogs = async (reset = false) => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,actor_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      // Pagination
      const currentPage = reset ? 0 : page;
      query = query.range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (reset) {
        setLogs((data || []) as AuditLogEntry[]);
        setPage(0);
      } else {
        setLogs(prev => [...prev, ...((data || []) as AuditLogEntry[])]);
      }

      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Load more logs for pagination
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Export audit logs to CSV
  const exportToCSV = () => {
    try {
      const headers = [
        'Date/Time', 'Action', 'Actor', 'Role', 'Description', 
        'Resource Type', 'Resource ID', 'IP Address', 'Impersonation'
      ];
      
      const csvData = logs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.actor_email || 'System',
        log.actor_role || 'N/A',
        log.description,
        log.resource_type,
        log.resource_id || 'N/A',
        log.ip_address || 'N/A',
        log.metadata?.session_token ? 'Yes' : 'No'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Audit logs exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export audit logs');
    }
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    const iconMap: Record<string, any> = {
      'user_invited': User,
      'impersonation_started': Crown,
      'impersonation_ended': Crown,
      'tenant_created': Shield,
      'login': Activity,
      'logout': Activity,
      'password_reset': AlertTriangle,
    };
    
    const Icon = iconMap[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  // Get action color
  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      'user_invited': 'text-blue-600',
      'impersonation_started': 'text-purple-600',
      'impersonation_ended': 'text-purple-600',
      'tenant_created': 'text-green-600',
      'login': 'text-green-600',
      'logout': 'text-orange-600',
      'password_reset': 'text-red-600',
    };
    
    return colorMap[action] || 'text-gray-600';
  };

  // Initial load and filter changes
  useEffect(() => {
    loadAuditLogs(true);
  }, [searchTerm, actionFilter, dateRange]);

  // Load more when page changes
  useEffect(() => {
    if (page > 0) {
      loadAuditLogs(false);
    }
  }, [page]);

  if (error && logs.length === 0) {
    return <ErrorState message={error} onRetry={() => loadAuditLogs(true)} />;
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor all system activities and security events</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger>
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="user_invited">User Invited</SelectItem>
            <SelectItem value="impersonation_started">Impersonation Started</SelectItem>
            <SelectItem value="impersonation_ended">Impersonation Ended</SelectItem>
            <SelectItem value="tenant_created">Tenant Created</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="password_reset">Password Reset</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="mr-2 h-4 w-4" />
          <span className="text-sm">Date Range</span>
        </div>

        <div className="text-sm text-muted-foreground flex items-center">
          <FileText className="h-4 w-4 mr-1" />
          {logs.length} logs shown
        </div>
      </motion.div>

      {/* Audit Logs Table */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          {isLoading && logs.length === 0 ? (
            <div className="p-8">
              <LoadingState message="Loading audit logs..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8">
              <DataEmpty 
                message="No audit logs found"
                description="No system activities match your current filters"
              />
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Impersonation</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          <span className="font-medium">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.actor_email || 'System'}</div>
                          {log.actor_role && (
                            <Badge variant="outline" className="text-xs">
                              {log.actor_role}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={log.description}>
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.resource_type}</div>
                          {log.resource_id && (
                            <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {log.resource_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.metadata?.session_token ? (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Impersonated
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {log.ip_address || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 text-center border-t">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}