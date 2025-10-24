import { useState, useEffect } from 'react';
import { MessageCircle, X, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatRequestMessage, formatRelativeTime, getStatusColor } from '@/lib/messageFormatter';
import { RequestChatView } from './RequestChatView';

interface MyRequestsPanelProps {
  sessionToken: string;
  qrToken: string;
}

interface QRRequest {
  id: string;
  request_type: string;
  request_data: any;
  status: string;
  priority?: string;
  created_at: string;
  room?: { room_number: string };
  formatted_summary?: string;
}

export function MyRequestsPanel({ sessionToken, qrToken }: MyRequestsPanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<QRRequest | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // 🔧 Phase 1: Try localStorage as fallback if sessionToken is empty
  const effectiveSessionToken = sessionToken || localStorage.getItem('qr_session_token') || '';
  
  console.log('🔍 MyRequestsPanel - sessionToken:', sessionToken, 'effectiveToken:', effectiveSessionToken);

  // 🔄 Enhanced session sync mechanism
  // Clears old cache and forces refetch when session changes
  useEffect(() => {
    if (sessionToken) {
      console.log('✅ [Session Sync] Session token updated:', sessionToken);
      
      // Step 1: Clear old cached requests for different sessions
      queryClient.removeQueries({ 
        queryKey: ['guest-requests'], 
        predicate: (query) => {
          const key = query.queryKey as string[];
          // Remove cache entries that don't match current session
          return key[2] !== sessionToken;
        }
      });
      
      // Step 2: Force immediate refetch for current QR code
      queryClient.invalidateQueries({ 
        queryKey: ['guest-requests', qrToken, sessionToken] 
      });
      
      console.log('🔄 [Session Sync] Cache cleared and refetch triggered');
    }
  }, [sessionToken, qrToken, queryClient]);

  // ✅ OPTIMIZED: Single JOIN query instead of 3-step approach (Phase 2)
  const { data: requests = [], isLoading, refetch, error: requestError } = useQuery({
    queryKey: ['guest-requests', qrToken, effectiveSessionToken],
    queryFn: async () => {
      console.log('🚀 [MyRequestsPanel] Fetching requests with optimized query for:', qrToken);
      
      if (!qrToken) {
        console.warn('⚠️ No QR token available');
        return [];
      }

      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        // ✅ SINGLE OPTIMIZED QUERY with JOINs (replaces 3-step approach)
        const { data, error } = await supabase
          .from('qr_requests')
          .select(`
            *,
            room:rooms(room_number),
            guest_sessions!inner(qr_code_id, qr_codes!inner(qr_token))
          `)
          .eq('guest_sessions.qr_codes.qr_token', qrToken)
          .gte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Query error:', error);
          throw error;
        }

        console.log('✅ Fetched', data?.length || 0, 'requests in single query');
        return (data || []) as QRRequest[];
      } catch (error) {
        console.error('💥 [MyRequestsPanel] Query failed:', error);
        throw error;
      }
    },
    enabled: !!qrToken,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 10000
  });

  // 🔔 Real-time subscription for ALL requests on this QR code
  // Enhanced with QR code ID lookup for more efficient filtering
  useEffect(() => {
    if (!qrToken) {
      console.log('⚠️ No QR token - skipping real-time subscription');
      return;
    }

    console.log('🔔 Setting up real-time subscription for QR token:', qrToken);

    let qrCodeId: string | null = null;
    let sessionIds: string[] = [];

    // Pre-fetch QR code ID and session IDs for efficient filtering
    const setupSubscription = async () => {
      try {
        // Get QR code ID
        const { data: qrCodeData } = await supabase
          .from('qr_codes')
          .select('id')
          .eq('qr_token', qrToken)
          .maybeSingle();

        if (!qrCodeData) {
          console.warn('⚠️ QR code not found for real-time subscription');
          return;
        }

        qrCodeId = qrCodeData.id;

        // Get all session IDs for this QR code
        const { data: sessionsData } = await supabase
          .from('guest_sessions')
          .select('id')
          .eq('qr_code_id', qrCodeId);

        sessionIds = sessionsData?.map(s => s.id) || [];
        console.log('🔔 Monitoring', sessionIds.length, 'sessions for updates');

        // Subscribe to changes for requests in these sessions
        const channel = supabase
          .channel(`qr-requests-${qrToken}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'qr_requests'
            },
            (payload) => {
              console.log('🔔 Real-time update detected:', {
                event: payload.eventType,
                requestId: (payload.new as any)?.id || (payload.old as any)?.id,
                sessionId: (payload.new as any)?.session_id || (payload.old as any)?.session_id
              });

              // Check if this update is for one of our sessions
              const affectedSessionId = (payload.new as any)?.session_id || (payload.old as any)?.session_id;
              
              if (affectedSessionId && sessionIds.includes(affectedSessionId)) {
                console.log('✅ Update is for our QR code, refreshing requests');
                queryClient.invalidateQueries({ 
                  queryKey: ['guest-requests', qrToken] 
                });
              } else {
                console.log('⏭️ Update is for different QR code, ignoring');
              }
            }
          )
          .subscribe((status) => {
            console.log('🔔 Real-time subscription status:', status);
          });

        // Store channel for cleanup
        return channel;
      } catch (error) {
        console.error('❌ Failed to setup real-time subscription:', error);
        return null;
      }
    };

    let channelPromise = setupSubscription();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      channelPromise.then(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, [qrToken, queryClient]);

  // Count unread messages across all requests
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages', sessionToken],
    queryFn: async () => {
      const requestIds = requests.map(r => r.id);
      if (requestIds.length === 0) return 0;

      const { count } = await supabase
        .from('guest_messages')
        .select('*', { count: 'exact', head: true })
        .in('qr_request_id', requestIds)
        .eq('sender_type', 'staff')
        .eq('is_read', false);

      return count || 0;
    },
    enabled: requests.length > 0,
    refetchInterval: 5000
  });

  const getRequestIcon = (type: string) => {
    const icons: Record<string, string> = {
      HOUSEKEEPING: '🧹',
      ROOM_SERVICE: '🥘',
      DIGITAL_MENU: '🥘',
      MAINTENANCE: '🔧',
      FEEDBACK: '⭐',
      WIFI_ACCESS: '📶'
    };
    return icons[type] || '📝';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'acknowledged':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleRequestClick = (request: QRRequest) => {
    setSelectedRequest(request);
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
    refetch();
  };

  // 🔧 Phase 1A: Always render button visible (never disabled)
  const isSessionValid = !!effectiveSessionToken;
  
  console.log('🔍 [MyRequestsPanel] Button render - isSessionValid:', isSessionValid, 'isOpen:', isOpen, 'requests:', requests.length);
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="lg"
            className="relative bg-[hsl(45,100%,50%)] hover:bg-[hsl(45,100%,45%)] text-black shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-[hsl(45,100%,40%)]"
            title="View your service requests"
            onClick={() => console.log('🔍 [MyRequestsPanel] Button clicked')}
          >
            {isLoading && isSessionValid ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="h-5 w-5 mr-2" />
            )}
            My Requests
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
          {!selectedRequest ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  My Service Requests
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-3">
                {!isSessionValid ? (
                  <div className="text-center py-12 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Initializing session...</p>
                    <p className="text-xs text-muted-foreground">Please wait while we connect to your room</p>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No requests yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your service requests will appear here
                    </p>
                  </div>
                ) : (
                  requests.map((request) => {
                    const formatted = formatRequestMessage(request);
                    return (
                      <Card
                        key={request.id}
                        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40"
                        onClick={() => handleRequestClick(request)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{getRequestIcon(request.request_type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-medium text-sm truncate">
                                  {formatted.title}
                                </h3>
                                {getStatusIcon(request.status)}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {formatted.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-700`}
                                >
                                  {request.status.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(request.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="mb-4 flex-shrink-0"
              >
                ← Back to requests
              </Button>
              <div className="flex-1 min-h-0">
                <RequestChatView
                  request={selectedRequest}
                  qrToken={qrToken}
                  sessionToken={sessionToken}
                  onClose={handleBackToList}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
