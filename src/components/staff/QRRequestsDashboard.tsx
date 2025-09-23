import React, { useState } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQRRealtime } from '@/hooks/useQRRealtime';
import { useFolioIntegration } from '@/hooks/useFolioIntegration';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
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
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<QRRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  
  // Use real-time hook and folio integration
  const { orders: requests, loading: isLoading, updateOrderStatus, assignOrder } = useQRRealtime();
  const { processServiceCompletion } = useFolioIntegration();

  // Filter requests based on status and role
  const filteredRequests = requests.filter(request => {
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    
    // Role-based filtering
    if (userRole === 'HOUSEKEEPING') {
      return statusMatch && request.service_type === 'housekeeping';
    } else if (userRole === 'MAINTENANCE') {
      return statusMatch && request.service_type === 'maintenance';
    } else if (userRole === 'POS') {
      return statusMatch && request.service_type === 'room_service';
    }
    
    return statusMatch;
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
    assignOrder(requestId, user?.id);
  };

  const handleStatusUpdate = async (requestId: string, status: string, note?: string) => {
    const success = await updateOrderStatus(requestId, status, note);
    
    if (success && status === 'completed') {
      // Find the request to get service details
      const request = filteredRequests.find(r => r.id === requestId);
      if (request) {
        // Process folio integration for chargeable services
        await processServiceCompletion(
          requestId,
          request.service_type,
          request.room_id
        );
      }
    }
  };

  const handleSendResponse = async () => {
    if (!selectedRequest || !responseMessage.trim()) return;
    
    try {
      const { error } = await supabase
        .from('qr_request_messages')
        .insert([{
          request_id: selectedRequest.id,
          tenant_id: user?.tenant_id,
          sender_id: user?.id,
          sender_role: 'staff',
          message: responseMessage,
          message_payload: {}
        }]);

      if (error) throw error;
      
      setResponseMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleViewDetails = (request: any) => {
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
            {filteredRequests.filter(r => r.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {filteredRequests.filter(r => r.status === 'assigned').length} Assigned
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
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No requests found</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
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
                              Room {request.room_id || 'Unknown'}
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
                            disabled={isLoading}
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
                            disabled={isLoading}
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
                            disabled={isLoading}
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
                  <p>Room {selectedRequest.room_id || 'Unknown'}</p>
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
                            disabled={isLoading}
                      >
                        Mark as Preparing
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'completed', responseMessage)}
                        disabled={isLoading}
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