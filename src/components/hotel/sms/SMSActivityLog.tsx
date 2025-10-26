import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SMSLog {
  id: string;
  created_at: string;
  event_type: string | null;
  recipient_phone: string | null;
  message_preview: string | null;
  status: string;
  delivery_status: string;
  credits_used: number;
  cost_per_credit: number;
  error_code: string | null;
}

export function SMSActivityLog() {
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['sms-activity-log'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SMSLog[];
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Date', 'Time', 'Event Type', 'Recipient', 'Message', 'Status', 'Cost', 'Error'].join(','),
        ...logs.map(log => [
          format(new Date(log.created_at), 'yyyy-MM-dd'),
          format(new Date(log.created_at), 'HH:mm:ss'),
          log.event_type || 'N/A',
          log.recipient_phone || 'N/A',
          `"${(log.message_preview || 'N/A').replace(/"/g, '""')}"`,
          log.status,
          `₦${(log.credits_used * log.cost_per_credit).toFixed(2)}`,
          log.error_code || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sms_activity_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Activity log exported successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export activity log");
    }
  };

  const getStatusBadge = (status: string, deliveryStatus: string) => {
    if (status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (status === 'sent' && deliveryStatus === 'delivered') {
      return <Badge variant="default">Delivered</Badge>;
    }
    if (status === 'sent') {
      return <Badge variant="secondary">Sent</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading activity log...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SMS Activity Log</CardTitle>
            <CardDescription>
              Real-time log of all SMS activities (Last 50 messages)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No SMS activity yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      <div>{format(new Date(log.created_at), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.event_type ? (
                        <Badge variant="outline">
                          {log.event_type.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.recipient_phone || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm" title={log.message_preview || undefined}>
                        {log.message_preview || 'N/A'}
                      </div>
                      {log.error_code && (
                        <div className="text-xs text-destructive mt-1">
                          Error: {log.error_code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status, log.delivery_status)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₦{(log.credits_used * log.cost_per_credit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
