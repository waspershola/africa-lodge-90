import { useState } from 'react';
import { Download, Calendar, Filter, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface AuditLogExporterProps {
  className?: string;
}

interface ExportFilters {
  dateRange: DateRange | undefined;
  action?: string;
  actorId?: string;
  resourceType?: string;
  tenantId?: string;
}

export function AuditLogExporter({ className }: AuditLogExporterProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: undefined
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'json') => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) {
      toast({
        title: "Date range required",
        description: "Please select a date range for the export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      console.log('Exporting audit logs with filters:', filters);

      // Build query with filters
      let query = supabase
        .from('audit_log')
        .select('*')
        .gte('created_at', filters.dateRange.from.toISOString())
        .lte('created_at', filters.dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.actorId) {
        query = query.eq('actor_id', filters.actorId);
      }

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      if (!data || data.length === 0) {
        toast({
          title: "No data found",
          description: "No audit logs match the selected criteria",
        });
        return;
      }

      console.log(`Exporting ${data.length} audit log entries`);

      if (format === 'csv') {
        exportToCSV(data);
      } else {
        exportToJSON(data);
      }

      toast({
        title: "Export successful",
        description: `Exported ${data.length} audit log entries as ${format.toUpperCase()}`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export audit logs",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (data: any[]) => {
    if (data.length === 0) return;

    // Define CSV headers
    const headers = [
      'ID',
      'Actor ID', 
      'Actor Email',
      'Action',
      'Resource Type',
      'Resource ID',
      'Tenant ID',
      'Description',
      'IP Address',
      'User Agent',
      'Metadata',
      'Created At'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => [
        `"${row.id || ''}"`,
        `"${row.actor_id || ''}"`,
        `"${row.actor_email || ''}"`,
        `"${row.action || ''}"`,
        `"${row.resource_type || ''}"`,
        `"${row.resource_id || ''}"`,
        `"${row.tenant_id || ''}"`,
        `"${(row.description || '').replace(/"/g, '""')}"`,
        `"${row.ip_address || ''}"`,
        `"${(row.user_agent || '').replace(/"/g, '""')}"`,
        `"${row.metadata ? JSON.stringify(row.metadata).replace(/"/g, '""') : ''}"`,
        `"${row.created_at || ''}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[]) => {
    const jsonContent = JSON.stringify({
      exported_at: new Date().toISOString(),
      filters: filters,
      total_records: data.length,
      audit_logs: data
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Audit Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Export audit logs for compliance, forensic analysis, or external reporting. 
            All exports include full audit trail with metadata.
          </AlertDescription>
        </Alert>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range (Required)</Label>
          <DatePickerWithRange
            dateRange={filters.dateRange}
            setDateRange={(range) => setFilters(prev => ({
              ...prev,
              dateRange: range
            }))}
          />
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <Label htmlFor="action">Action (Optional)</Label>
          <Select
            value={filters.action || ''}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              action: value || undefined 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="user_created">User Created</SelectItem>
              <SelectItem value="user_invited">User Invited</SelectItem>
              <SelectItem value="user_deleted">User Deleted</SelectItem>
              <SelectItem value="user_suspended">User Suspended</SelectItem>
              <SelectItem value="user_unsuspended">User Unsuspended</SelectItem>
              <SelectItem value="tenant_created">Tenant Created</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="impersonation_started">Impersonation Started</SelectItem>
              <SelectItem value="impersonation_ended">Impersonation Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resource Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="resourceType">Resource Type (Optional)</Label>
          <Select
            value={filters.resourceType || ''}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              resourceType: value || undefined 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by resource type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resources</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="reservation">Reservation</SelectItem>
              <SelectItem value="room">Room</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actor ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="actorId">Actor ID (Optional)</Label>
          <Input
            id="actorId"
            placeholder="Filter by specific user ID"
            value={filters.actorId || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              actorId: e.target.value || undefined 
            }))}
          />
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export as CSV'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export as JSON'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}