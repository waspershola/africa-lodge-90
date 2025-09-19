import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApprovalDialog, { type ApprovalRequest } from '@/components/pos/ApprovalDialog';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/pos/RoleGuard';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Clock,
  DollarSign,
  FileText,
  Package
} from 'lucide-react';

export default function ApprovalsPage() {
  const { hasPermission } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

  // Mock approval requests for development
  const mockRequests: ApprovalRequest[] = [
    {
      id: 'req-1',
      type: 'price_change',
      requestor_id: 'user-123',
      requestor_name: 'John Doe',
      entity_id: 'item-789',
      entity_name: 'Grilled Chicken',
      current_value: 2500,
      requested_value: 2750,
      reason: 'Ingredient costs have increased by 10%',
      status: 'pending',
      created_at: new Date().toISOString(),
      urgency: 'medium'
    },
    {
      id: 'req-2',
      type: 'void_order',
      requestor_id: 'user-456',
      requestor_name: 'Jane Smith',
      entity_id: 'ord-123',
      entity_name: 'Order #ORD-001',
      current_value: 'completed',
      requested_value: 'void',
      reason: 'Customer complaint - food quality issue',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      urgency: 'high'
    },
    {
      id: 'req-3',
      type: 'refund',
      requestor_id: 'user-789',
      requestor_name: 'Mike Johnson',
      entity_id: 'payment-456',
      entity_name: 'Payment #PAY-002',
      current_value: 5000,
      requested_value: 0,
      reason: 'Accidental double charge',
      status: 'approved',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      urgency: 'medium'
    }
  ];

  const [requests, setRequests] = useState(mockRequests);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_change': return <DollarSign className="h-5 w-5" />;
      case 'void_order': return <X className="h-5 w-5" />;
      case 'menu_availability': return <Package className="h-5 w-5" />;
      case 'refund': return <DollarSign className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'orange';
      default: return 'secondary';
    }
  };

  const handleApprove = async (requestId: string, notes?: string) => {
    setRequests(prev => 
      prev.map(r => r.id === requestId ? {...r, status: 'approved' as const} : r)
    );
  };

  const handleReject = async (requestId: string, reason: string) => {
    setRequests(prev => 
      prev.map(r => r.id === requestId ? {...r, status: 'rejected' as const} : r)
    );
  };

  return (
    <RoleGuard requiredRole={['staff', 'chef', 'manager', 'owner']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Approval Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and process staff approval requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {pendingRequests.filter(r => r.urgency === 'high').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved Today</p>
                  <p className="text-2xl font-bold text-green-600">
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Processed ({processedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    No pending approval requests at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map(request => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(request.type)}
                            <h3 className="font-semibold">{request.entity_name}</h3>
                            <Badge variant={getUrgencyColor(request.urgency) as any}>
                              {request.urgency}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            Requested by <strong>{request.requestor_name}</strong> • 
                            {new Date(request.created_at).toLocaleString()}
                          </p>

                          <p className="text-sm mb-3">{request.reason}</p>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs font-medium text-red-700">Current</p>
                              <p className="font-mono text-red-900">
                                {request.type === 'price_change' && typeof request.current_value === 'number' 
                                  ? `₦${(request.current_value / 100).toFixed(2)}`
                                  : String(request.current_value)
                                }
                              </p>
                            </div>
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                              <p className="text-xs font-medium text-green-700">Requested</p>
                              <p className="font-mono text-green-900">
                                {request.type === 'price_change' && typeof request.requested_value === 'number' 
                                  ? `₦${(request.requested_value / 100).toFixed(2)}`
                                  : String(request.requested_value)
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processed" className="space-y-4">
            <div className="grid gap-4">
              {processedRequests.map(request => (
                <Card key={request.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(request.type)}
                          <h3 className="font-semibold">{request.entity_name}</h3>
                          <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                            {request.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {request.requestor_name} • {new Date(request.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        {request.status === 'approved' ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <X className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Approval Dialog */}
        {selectedRequest && (
          <ApprovalDialog
            isOpen={!!selectedRequest}
            onClose={() => setSelectedRequest(null)}
            request={selectedRequest}
            canApprove={hasPermission('pos:approve_requests')}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </RoleGuard>
  );
}