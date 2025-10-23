import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle, XCircle, MessageSquare, Volume2, VolumeX, AlertCircle } from 'lucide-react';
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
  const [sessionValid, setSessionValid] = useState<boolean>(true);
  const [sessionExpiry, setSessionExpiry] = useState<string | null>(null);

  // Enable guest notifications with sound
  const { toggleMute, isMuted } = useGuestNotifications({
    sessionToken,
    enableSound: true,
    enableToast: true
  });

  // 🔒 Phase 3.2 & 3.3: Validate session and check expiry
  useEffect(() => {
    const validateAndFetchRequests = async () => {
      if (!sessionToken) {
        setError('No session token provided');
        setLoading(false);
        return;
      }

      try {
        // Check session expiry from localStorage
        const storedExpiry = localStorage.getItem('qr_session_expiry');
        if (storedExpiry) {
          const expiryDate = new Date(storedExpiry);
          const now = new Date();
          
          if (now > expiryDate) {
            setSessionValid(false);
            setError('Your session has expired. Please scan the QR code again.');
            setLoading(false);
            return;
          }
          
          setSessionExpiry(storedExpiry);
        }

        // Fetch persistent requests
        const { data, error: fetchError } = await supabase
          .from('qr_requests')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('is_persistent', true)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setRequests(data || []);
        setSessionValid(true);
      } catch (err) {
        console.error('Error fetching request history:', err);
        setError('Failed to load request history');
      } finally {
        setLoading(false);
      }
    };

    validateAndFetchRequests();

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
          console.log('Real-time update:', payload);
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

  // 🔒 Phase 3.3: Session expiry helper
  const getSessionTimeRemaining = () => {
    if (!sessionExpiry) return null;
    const expiry = new Date(sessionExpiry);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) return `${diffMins}m`;
    return `${diffHours}h ${diffMins}m`;
  };

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
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading your requests...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {!sessionValid ? 'Session Expired' : 'Unable to Load Requests'}
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            {!sessionValid && (
              <p className="text-sm text-muted-foreground">
                Please scan the QR code in your room to create a new session.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Requests</h1>
            <p className="text-muted-foreground">Track all your service requests in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            {sessionExpiry && sessionValid && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Session expires in {getSessionTimeRemaining()}
              </Badge>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleMute()}
              className="relative"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Request List */}
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No requests yet</p>
                <p className="text-sm mt-2">Your service requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="shadow-sm">
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
                          <h3 className="font-semibold text-lg capitalize">
                            {request.request_type.replace('_', ' ')}
                          </h3>
                          {request.request_data?.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.request_data.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created {formatDistanceToNow(new Date(request.created_at))} ago
                        </span>
                        {request.resume_short_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(request.resume_short_url!, '_blank')}
                            className="h-7"
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
