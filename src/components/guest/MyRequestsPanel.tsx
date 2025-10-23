import { useState } from 'react';
import { MessageCircle, X, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
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
  
  // 🔧 Phase 1: Try localStorage as fallback if sessionToken is empty
  const effectiveSessionToken = sessionToken || localStorage.getItem('qr_session_token') || '';
  
  console.log('🔍 MyRequestsPanel - sessionToken:', sessionToken, 'effectiveToken:', effectiveSessionToken);

  // 🔧 Phase 1: Fetch all requests for this session using effective token
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['guest-requests', effectiveSessionToken],
    queryFn: async () => {
      if (!effectiveSessionToken) {
        console.warn('⚠️ No session token available for fetching requests');
        return [];
      }

      const { data: session } = await supabase
        .from('guest_sessions')
        .select('id')
        .eq('session_id', effectiveSessionToken)
        .single();

      if (!session) {
        console.warn('⚠️ No guest session found for token:', effectiveSessionToken);
        return [];
      }

      const { data, error } = await supabase
        .from('qr_requests')
        .select('*, room:rooms(room_number)')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching requests:', error);
        throw error;
      }
      
      console.log('✅ Fetched requests:', data?.length || 0);
      return (data || []) as QRRequest[];
    },
    enabled: !!effectiveSessionToken,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

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

  // 🔧 Phase 1: Always render button, show loading/disabled states appropriately
  const isSessionValid = !!effectiveSessionToken;
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="relative bg-white/90 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:border-primary/40 shadow-lg"
            disabled={!isSessionValid}
            title={!isSessionValid ? 'Initializing session...' : 'View your requests'}
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
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center animate-pulse"
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
                {isLoading ? (
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
