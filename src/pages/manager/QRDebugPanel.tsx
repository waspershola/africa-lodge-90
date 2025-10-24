import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Search,
  Monitor,
  Database
} from 'lucide-react';
import { format } from 'date-fns';

export default function QRDebugPanel() {
  const [qrToken, setQrToken] = useState('');
  const [sessionId, setSessionId] = useState('');

  // Active Sessions
  const { data: activeSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['debug-active-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_sessions')
        .select(`
          *,
          qr_codes(label, qr_token, qr_type),
          rooms(room_number)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });

  // Session Audit Log
  const { data: auditLog } = useQuery({
    queryKey: ['debug-audit-log', sessionId],
    queryFn: async () => {
      let query = supabase
        .from('qr_session_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (sessionId) {
        query = query.eq('guest_session_uuid', sessionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true
  });

  // QR Code Stats
  const { data: qrStats } = useQuery({
    queryKey: ['debug-qr-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          id,
          label,
          qr_type,
          is_active,
          scan_count,
          last_scanned_at,
          guest_sessions!inner(count)
        `)
        .order('scan_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Recent Requests
  const { data: recentRequests } = useQuery({
    queryKey: ['debug-recent-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_requests')
        .select(`
          *,
          guest_sessions(session_id, device_fingerprint),
          rooms(room_number)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR System Debug Panel</h1>
          <p className="text-muted-foreground">Monitor sessions, audit logs, and system health</p>
        </div>
        <Button onClick={() => refetchSessions()} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="stats">QR Stats</TabsTrigger>
          <TabsTrigger value="requests">Recent Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Guest Sessions ({activeSessions?.length || 0})
              </CardTitle>
              <CardDescription>Currently active QR scanning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions?.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{session.qr_codes?.label || 'Unknown QR'}</Badge>
                        <Badge variant="secondary">{session.qr_codes?.qr_type}</Badge>
                        {session.rooms?.room_number && (
                          <Badge>Room {session.rooms.room_number}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Session: {session.session_id.substring(0, 13)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Device: {session.device_fingerprint?.substring(0, 20) || 'none'} | 
                        Created: {format(new Date(session.created_at), 'MMM d, HH:mm:ss')} | 
                        Expires: {format(new Date(session.expires_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                ))}
                {!activeSessions?.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sessions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Session Audit Log
              </CardTitle>
              <CardDescription>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Filter by session UUID..."
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button variant="outline" size="sm" onClick={() => setSessionId('')}>
                    Clear
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLog?.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Monitor className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          log.event_type === 'session_created' ? 'default' :
                          log.event_type === 'session_resumed' ? 'secondary' :
                          'destructive'
                        }>
                          {log.event_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                      <div className="text-sm">{log.reason}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Device: {log.device_fingerprint?.substring(0, 30) || 'none'}
                      </div>
                    </div>
                  </div>
                ))}
                {!auditLog?.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Statistics</CardTitle>
              <CardDescription>Most scanned QR codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qrStats?.map((qr: any) => (
                  <div key={qr.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{qr.label}</span>
                        <Badge variant="outline">{qr.qr_type}</Badge>
                        <Badge variant={qr.is_active ? 'default' : 'secondary'}>
                          {qr.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {qr.scan_count} scans | Last: {qr.last_scanned_at ? format(new Date(qr.last_scanned_at), 'MMM d, HH:mm') : 'Never'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Latest guest requests from QR portal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRequests?.map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge>{request.request_type}</Badge>
                        <Badge variant={
                          request.status === 'completed' ? 'default' :
                          request.status === 'in-progress' ? 'secondary' :
                          'outline'
                        }>
                          {request.status}
                        </Badge>
                        {request.rooms?.room_number && (
                          <span className="text-sm text-muted-foreground">
                            Room {request.rooms.room_number}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {request.tracking_number} | {format(new Date(request.created_at), 'MMM d, HH:mm:ss')}
                      </div>
                    </div>
                    {request.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : request.status === 'in-progress' ? (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
