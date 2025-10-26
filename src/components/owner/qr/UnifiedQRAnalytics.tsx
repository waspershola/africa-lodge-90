import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnifiedQR } from '@/hooks/useUnifiedQR';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { BarChart3, Eye, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface UnifiedQRAnalyticsProps {
  qrCodeId?: string;
}

export function UnifiedQRAnalytics({ qrCodeId }: UnifiedQRAnalyticsProps) {
  const { data: tenantInfo } = useTenantInfo();
  const { useAllQRRequests, useQRAnalytics } = useUnifiedQR();
  
  const { data: allRequests = [], isLoading: requestsLoading } = useAllQRRequests(tenantInfo?.tenant_id || null);
  const { data: scanLogs = [], isLoading: analyticsLoading } = useQRAnalytics(qrCodeId || null);

  // Calculate statistics
  const stats = {
    totalRequests: allRequests.length,
    pendingRequests: allRequests.filter(r => r.status === 'pending').length,
    completedRequests: allRequests.filter(r => r.status === 'completed').length,
    totalScans: scanLogs.length,
  };

  const recentRequests = allRequests.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'acknowledged': return 'default';
      case 'in_progress': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'warning';
      case 'normal': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (requestsLoading || analyticsLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRequests > 0 
                ? `${Math.round((stats.completedRequests / stats.totalRequests) * 100)}% completion rate`
                : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">Total scans</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Latest service requests from guests</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requests yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{request.request_type.replace(/_/g, ' ')}</p>
                      <Badge variant={getStatusColor(request.status) as any}>
                        {request.status}
                      </Badge>
                      <Badge variant={getPriorityColor(request.priority) as any}>
                        {request.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.guest_name || 'Guest'} • Room {request.rooms?.room_number || 'N/A'}
                    </p>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground italic">{request.notes}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{format(new Date(request.created_at), 'MMM d, HH:mm')}</p>
                    {request.completed_at && (
                      <p className="text-xs">Completed {format(new Date(request.completed_at), 'MMM d, HH:mm')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Logs (if qrCodeId provided) */}
      {qrCodeId && (
        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>Recent QR code scans</CardDescription>
          </CardHeader>
          <CardContent>
            {scanLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scans recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {scanLogs.slice(0, 10).map((scan: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <Badge variant="outline">{scan.scan_type}</Badge>
                      <span className="ml-2 text-muted-foreground">
                        {scan.device_info?.userAgent ? 'Mobile' : 'Desktop'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(scan.scanned_at), 'MMM d, HH:mm:ss')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}