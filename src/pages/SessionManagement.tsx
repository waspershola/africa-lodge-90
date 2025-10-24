import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Activity,
  XCircle,
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserSession {
  id: string;
  user_id: string;
  tenant_id: string | null;
  session_token: string;
  user_role: string;
  device_type: string;
  device_name: string;
  browser_name: string;
  os_name: string;
  ip_address: string | null;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
  heartbeat_count: number;
  max_idle_hours: number;
}

interface SessionWithUser extends UserSession {
  user_email?: string;
  user_name?: string;
  tenant_name?: string;
}

export default function SessionManagement() {
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  // Fetch all active sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['admin-sessions', selectedTenant],
    queryFn: async () => {
      // First get sessions
      let query = supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (selectedTenant) {
        query = query.eq('tenant_id', selectedTenant);
      }

      const { data: sessionsData, error: sessionsError } = await query;
      if (sessionsError) throw sessionsError;

      // Then enrich with user and tenant data
      const enrichedSessions = await Promise.all(
        (sessionsData || []).map(async (session) => {
          // Get user data
          const { data: userData } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', session.user_id)
            .single();

          // Get tenant data if available
          let tenantData = null;
          if (session.tenant_id) {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('hotel_name')
              .eq('tenant_id', session.tenant_id)
              .single();
            tenantData = tenant;
          }

          return {
            ...session,
            user_email: userData?.email,
            user_name: userData?.name,
            tenant_name: tenantData?.hotel_name
          } as SessionWithUser;
        })
      );

      return enrichedSessions;
    },
    refetchInterval: 120000, // Phase 8: Increased to 2 minutes (admin page, sessions change infrequently)
  });

  // Revoke session mutation
  const revokeMutation = useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const { error } = await supabase.rpc('revoke_all_user_sessions', {
        p_user_id: userId,
        p_reason: 'Admin revocation'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      toast.success('Session revoked successfully');
    },
    onError: (error) => {
      toast.error('Failed to revoke session: ' + error.message);
    },
  });

  // Cleanup old sessions mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('cleanup_old_sessions');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      toast.success('Old sessions cleaned up');
    },
    onError: (error) => {
      toast.error('Cleanup failed: ' + error.message);
    },
  });

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-red-500',
      OWNER: 'bg-purple-500',
      MANAGER: 'bg-blue-500',
      FRONT_DESK: 'bg-green-500',
      HOUSEKEEPING: 'bg-yellow-500',
      MAINTENANCE: 'bg-orange-500',
      POS: 'bg-teal-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Session Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage user sessions across all devices
          </p>
        </div>
        <Button
          onClick={() => cleanupMutation.mutate()}
          disabled={cleanupMutation.isPending}
          variant="outline"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cleanup Old Sessions
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Desktop Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions?.filter(s => s.device_type === 'desktop').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions?.filter(s => s.device_type === 'mobile').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Heartbeats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions?.length 
                ? Math.round(sessions.reduce((sum, s) => sum + s.heartbeat_count, 0) / sessions.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Real-time view of all active user sessions with device information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Heartbeats</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{session.user_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {session.user_email}
                      </span>
                      {session.tenant_name && (
                        <span className="text-xs text-muted-foreground">
                          {session.tenant_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(session.user_role)}>
                      {session.user_role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.device_type)}
                      <div className="flex flex-col text-xs">
                        <span>{session.device_name}</span>
                        <span className="text-muted-foreground">
                          {session.browser_name} on {session.os_name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {session.ip_address || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-green-500" />
                      <span className="text-xs">{session.heartbeat_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDistanceToNow(new Date(session.expires_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => revokeMutation.mutate({
                        sessionId: session.id,
                        userId: session.user_id
                      })}
                      disabled={revokeMutation.isPending}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sessions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No active sessions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
