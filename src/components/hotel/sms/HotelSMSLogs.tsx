import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, Download, Filter } from "lucide-react";

interface SMSLog {
  id: string;
  tenant_id: string;
  template_id?: string;
  event_type?: string;
  credits_used: number;
  source_type: string;
  purpose?: string;
  recipient_phone?: string;
  message_preview?: string;
  status: string;
  delivery_status?: string;
  provider_response?: any;
  error_code?: string;
  created_at: string;
}

export function HotelSMSLogs() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, statusFilter]);

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Calculate date range
      const daysAgo = parseInt(dateFilter);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.recipient_phone?.includes(searchTerm) ||
        log.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message_preview?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Purpose', 'Recipient', 'Credits', 'Status', 'Message Preview'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.purpose || 'N/A',
        log.recipient_phone || 'N/A',
        log.credits_used,
        log.status,
        log.message_preview?.substring(0, 50) || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center">Loading SMS logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS History</h2>
          <p className="text-muted-foreground">View all SMS messages sent from your hotel</p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone, purpose, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last Day</SelectItem>
                  <SelectItem value="7">Last Week</SelectItem>
                  <SelectItem value="30">Last Month</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Complete history of SMS messages sent from your hotel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No SMS logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results'
                  : 'No SMS messages have been sent yet'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.purpose || log.event_type || 'Manual SMS'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.source_type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {log.recipient_phone || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs truncate">
                          {log.message_preview || 'No preview available'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-center">
                          {log.credits_used}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            log.status === 'sent' ? 'default' : 
                            log.status === 'failed' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {log.status}
                        </Badge>
                        {log.error_code && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {log.error_code}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}