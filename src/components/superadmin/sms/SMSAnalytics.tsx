import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Download, Filter, Search } from "lucide-react";
import { toast } from "sonner";

interface SMSLog {
  id: string;
  tenant_id: string;
  created_at: string;
  event_type?: string;
  recipient_phone?: string;
  message_preview?: string;
  status: string;
  delivery_status: string;
  credits_used: number;
  cost_per_credit: number;
  provider_id?: string;
  hotel_name: string;
  provider_name: string;
}

export function SMSAnalytics() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    hotel: '',
    status: '',
    eventType: ''
  });

  useEffect(() => {
    fetchSMSLogs();
  }, []);

  const fetchSMSLogs = async () => {
    try {
      // Fetch SMS logs with tenant and provider information
      const { data: logs, error } = await supabase
        .from('sms_logs')
        .select(`
          *
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get tenant and provider names separately
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, business_name');

      const { data: providers } = await supabase
        .from('sms_providers')
        .select('id, name');

      const tenantMap = new Map(tenants?.map(t => [t.id, t.business_name]) || []);
      const providerMap = new Map(providers?.map(p => [p.id, p.name]) || []);

      const formattedLogs = logs?.map(log => ({
        ...log,
        hotel_name: tenantMap.get(log.tenant_id) || 'Unknown Hotel',
        provider_name: providerMap.get(log.provider_id) || 'Unknown Provider'
      })) || [];

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      toast.error("Failed to load SMS logs");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('sms_logs')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      const { data: logs, error } = await query.limit(500);

      if (error) throw error;

      // Get tenant and provider names separately
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, business_name');

      const { data: providers } = await supabase
        .from('sms_providers')
        .select('id, name');

      const tenantMap = new Map(tenants?.map(t => [t.id, t.business_name]) || []);
      const providerMap = new Map(providers?.map(p => [p.id, p.name]) || []);

      const formattedLogs = logs?.map(log => ({
        ...log,
        hotel_name: tenantMap.get(log.tenant_id) || 'Unknown Hotel',
        provider_name: providerMap.get(log.provider_id) || 'Unknown Provider'
      })) || [];

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error("Failed to filter SMS logs");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const csvContent = [
        ['Date', 'Hotel', 'Event', 'Message', 'Status', 'Cost', 'Provider'].join(','),
        ...logs.map(log => [
          new Date(log.created_at).toLocaleDateString(),
          log.hotel_name,
          log.event_type || 'N/A',
          `"${log.message_preview || 'N/A'}"`,
          log.status,
          `₦${(log.credits_used * log.cost_per_credit).toFixed(2)}`,
          log.provider_name
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sms_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("SMS logs exported successfully");
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Failed to export SMS logs");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge>Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && logs.length === 0) {
    return <div className="flex justify-center p-8">Loading SMS analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Analytics & Logs</h2>
          <p className="text-muted-foreground">
            Platform-wide SMS activity logs and analytics
          </p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Event Type</Label>
              <Select value={filters.eventType} onValueChange={(value) => setFilters({ ...filters, eventType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All events</SelectItem>
                  <SelectItem value="booking_confirmed">Booking Confirmed</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="qr_request_staff">QR Request</SelectItem>
                  <SelectItem value="check_in_reminder">Check-in Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full" disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Activity Logs</CardTitle>
          <CardDescription>
            Detailed log of all SMS activities across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.hotel_name}
                  </TableCell>
                  <TableCell>
                    {log.event_type ? (
                      <Badge variant="outline">{log.event_type}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Manual</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm">
                      {log.message_preview || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell>
                    ₦{(log.credits_used * log.cost_per_credit).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.provider_name}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No SMS logs found for the selected filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}