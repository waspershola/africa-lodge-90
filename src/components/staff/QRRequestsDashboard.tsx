// Phase 4: Staff Dashboard for Managing QR Requests
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  User, 
  Phone,
  MapPin,
  AlertTriangle,
  Send
} from 'lucide-react';

interface QRRequest {
  id: string;
  service_type: string;
  status: string; // Made more flexible to handle all status values
  request_details: any;
  notes?: string;
  priority: number;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  assigned_at?: string;
  completed_at?: string;
  room_id: string;
  guest_session_id: string;
  assigned_team: string;
  qr_code?: {
    rooms: { room_number: string };
  };
  messages?: Array<{
    id: string;
    sender_role: string; // Made flexible to handle any role value
    message: string;
    created_at: string;
    is_read: boolean;
  }>;
}

interface QRRequestsDashboardProps {
  userRole?: string;
}

export const QRRequestsDashboard: React.FC<QRRequestsDashboardProps> = ({ userRole }) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<QRRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // Real-time subscription for updates
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase
      .channel(`qr_requests_${user.tenant_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_orders',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        (payload) => {
          console.log('QR Request update:', payload);
          queryClient.invalidateQueries({ queryKey: ['qr-requests'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_request_messages',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        (payload) => {
          console.log('QR Message update:', payload);
          queryClient.invalidateQueries({ queryKey: ['qr-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id, queryClient]);

  // Fetch requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['qr-requests', statusFilter, userRole],
    queryFn: async () => {
      if (!user?.tenant_id) return [];

      let query = supabase
        .from('qr_orders')
        .select(`
          *,
          qr_code:qr_codes(
            qr_token,
            room_id,
            rooms(room_number)
          ),
          messages:qr_request_messages(
            id, sender_role, message, created_at, is_read
          ),
          assigned_user:assigned_to(name, email)
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Role-based filtering
      if (userRole === 'HOUSEKEEPING') {
        query = query.eq('assigned_team', 'housekeeping');
      } else if (userRole === 'MAINTENANCE') {
        query = query.eq('assigned_team', 'maintenance');
      } else if (userRole === 'POS') {
        query = query.eq('assigned_team', 'kitchen');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.tenant_id
  });

  // Assign request mutation
  const assignRequestMutation = useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId?: string }) => {
      const { error } = await supabase
        .from('qr_orders')
        .update({
          assigned_to: userId || user?.id,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-requests'] });
      toast({ title: 'Request assigned successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error assigning request', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, note }: { requestId: string; status: string; note?: string }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id;
      }

      const { error } = await supabase
        .from('qr_orders')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // Add message if note provided
      if (note) {
        await supabase
          .from('qr_request_messages')
          .insert([{
            request_id: requestId,
            tenant_id: user?.tenant_id,
            sender_id: user?.id,
            sender_role: 'staff',
            message: note,
            message_payload: { status_change: status }
          }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-requests'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating status', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ requestId, message }: { requestId: string; message: string }) => {
      const { error } = await supabase
        .from('qr_request_messages')
        .insert([{
          request_id: requestId,
          tenant_id: user?.tenant_id,
          sender_id: user?.id,
          sender_role: 'staff',
          message,
          message_payload: {}
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-requests'] });
      setResponseMessage('');
      toast({ title: 'Message sent successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error sending message', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-purple-100 text-purple-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'on_route': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority > 2) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (priority > 1) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-green-500" />;
  };

  const handleAssignToMe = (requestId: string) => {
    assignRequestMutation.mutate({ requestId });
  };

  const handleStatusUpdate = (requestId: string, status: string, note?: string) => {
    updateStatusMutation.mutate({ requestId, status, note });
  };

  const handleSendResponse = () => {
    if (!selectedRequest || !responseMessage.trim()) return;
    sendMessageMutation.mutate({ 
      requestId: selectedRequest.id, 
      message: responseMessage 
    });
  };

  const handleViewDetails = (request: QRRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Service Requests</h1>
          <p className="text-muted-foreground">
            Manage guest requests from QR code scans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50">
            {requests.filter(r => r.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {requests.filter(r => r.status === 'assigned').length} Assigned
          </Badge>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="preparing">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          <div className="grid gap-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No requests found</p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getPriorityIcon(request.priority)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold capitalize">
                              {request.service_type.replace('_', ' ')}
                            </h3>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Room {request.qr_code?.rooms?.room_number || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(request.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {request.messages && request.messages.length > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {request.messages.length} messages
                              </span>
                            )}
                          </div>
                          {request.notes && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {request.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignToMe(request.id);
                            }}
                            disabled={assignRequestMutation.isPending}
                          >
                            <User className="h-4 w-4 mr-1" />
                            Assign to Me
                          </Button>
                        )}
                        {request.status === 'assigned' && (
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(request.id, 'accepted');
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        )}
                        {['accepted', 'preparing', 'on_route'].includes(request.status) && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(request.id, 'completed');
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            Complete
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(request);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Type</label>
                  <p className="capitalize">{selectedRequest.service_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Room</label>
                  <p>Room {selectedRequest.qr_code?.rooms?.room_number || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Request Details */}
              {selectedRequest.request_details && (
                <div>
                  <label className="text-sm font-medium">Request Details</label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedRequest.request_details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Messages */}
              {selectedRequest.messages && selectedRequest.messages.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Messages</label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {selectedRequest.messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`p-3 rounded-md ${
                          message.sender_role === 'staff' 
                            ? 'bg-blue-50 ml-4' 
                            : 'bg-gray-50 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium capitalize">
                            {message.sender_role}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Form */}
              <div>
                <label className="text-sm font-medium">Send Response</label>
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response to the guest..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'preparing', responseMessage)}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark as Preparing
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'completed', responseMessage)}
                        disabled={updateStatusMutation.isPending}
                      >
                        Complete Request
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSendResponse}
                      disabled={!responseMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};