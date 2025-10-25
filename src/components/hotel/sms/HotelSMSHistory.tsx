// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Download, Filter, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface SMSLog {
  id: string;
  created_at: string;
  event_type?: string;
  recipient_phone?: string;
  message_preview?: string;
  status: string;
  credits_used: number;
  cost_per_credit: number;
  purpose?: string;
}

export function HotelSMSHistory() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    eventType: ''
  });

  useEffect(() => {
    fetchSMSLogs();
  }, []);

  const fetchSMSLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { data: logs, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(logs || []);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      toast.error("Failed to load SMS history");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      let query = supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.eventType && filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType);
      }

      const { data: logs, error } = await query.limit(500);

      if (error) throw error;
      setLogs(logs || []);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error("Failed to filter SMS history");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const csvContent = [
        ['Date', 'Event', 'Recipient', 'Message', 'Status', 'Credits', 'Cost'].join(','),
        ...logs.map(log => [
          new Date(log.created_at).toLocaleDateString(),
          log.event_type || 'Manual',
          log.recipient_phone || 'N/A',
          `"${log.message_preview || 'N/A'}"`,
          log.status,
          log.credits_used,
          `₦${(log.credits_used * log.cost_per_credit).toFixed(2)}`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sms_history_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("SMS history exported successfully");
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Failed to export SMS history");
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
    return <div className="flex justify-center p-8">Loading SMS history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS History</h2>
          <p className="text-muted-foreground">
            View and analyze your SMS communication logs
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
                  <SelectItem value="all">All statuses</SelectItem>
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
                  <SelectItem value="all">All events</SelectItem>
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

      {/* SMS History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS Activity Log
          </CardTitle>
          <CardDescription>
            Detailed history of all SMS communications from your hotel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.event_type ? (
                      <Badge variant="outline">{log.event_type}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Manual</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.recipient_phone || 'N/A'}
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
                    {log.credits_used}
                  </TableCell>
                  <TableCell>
                    ₦{(log.credits_used * log.cost_per_credit).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No SMS history found</h3>
              <p>No SMS messages have been sent yet or match your current filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}