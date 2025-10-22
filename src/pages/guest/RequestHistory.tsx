import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle, XCircle, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useGuestNotifications } from '@/hooks/useGuestNotifications';

interface Request {
  id: string;
  request_type: string;
  request_data: any;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  resume_short_url?: string | null;
}

export default function RequestHistory() {
  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('s');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enable guest notifications with sound
  const { toggleMute, isMuted } = useGuestNotifications({
    sessionToken,
    enableSound: true,
    enableToast: true
  });

  useEffect(() => {
    if (!sessionToken) {
      setError('No session token provided');
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('qr_requests')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('is_persistent', true)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load request history');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Subscribe to realtime updates for this session
    const channel = supabase
      .channel(`request_history_${sessionToken}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_requests',
          filter: `session_token=eq.${sessionToken}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests((prev) => [payload.new as Request, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests((prev) =>
              prev.map((req) => (req.id === payload.new.id ? (payload.new as Request) : req))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionToken]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Request History</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleMute()}
                className="gap-2"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span className="text-sm">Unmute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Mute</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {request.tracking_number && (
                              <Badge variant="outline" className="font-mono text-xs">
                                #{request.tracking_number}
                              </Badge>
                            )}
                            <Badge className={getStatusColor(request.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                {request.status.replace('_', ' ')}
                              </span>
                            </Badge>
                          </div>
                          <h3 className="font-medium capitalize">
                            {request.request_type.replace('_', ' ')}
                          </h3>
                          {request.request_data?.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.request_data.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Created {formatDistanceToNow(new Date(request.created_at))} ago
                        </span>
                        {request.resume_short_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(request.resume_short_url!, '_blank')}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
