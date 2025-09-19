import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  X, 
  Clock, 
  Search,
  Filter,
  AlertTriangle,
  DollarSign,
  FileText,
  Plus,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ApprovalDialog, { type ApprovalRequest } from '@/components/pos/ApprovalDialog';

export default function ManagerApprovals() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);

  // Mock data - will be replaced with real API calls
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: 'req-1',
      type: 'new_item',
      requestor_id: 'staff-1',
      requestor_name: 'John Kitchen',
      entity_id: 'new',
      entity_name: 'Grilled Salmon Special',
      current_value: null,
      requested_value: {
        name: 'Grilled Salmon Special',
        category: 'Main Course',
        description: 'Fresh Atlantic salmon with lemon herbs and roasted vegetables',
        base_price: 4500, // ₦45.00
        prep_time_mins: 25,
        available: true,
        inventory_tracked: true,
        stations: ['grill', 'hot']
      },
      reason: 'New seasonal special requested by chef',
      status: 'pending',
      created_at: '2024-01-15T10:30:00Z',
      urgency: 'medium'
    },
    {
      id: 'req-2',
      type: 'price_change',
      requestor_id: 'staff-2',
      requestor_name: 'Mary Service',
      entity_id: 'item-1',
      entity_name: 'Caesar Salad',
      current_value: 1800,
      requested_value: 2200,
      reason: 'Ingredient costs have increased',
      status: 'pending',
      created_at: '2024-01-15T09:15:00Z',
      urgency: 'low'
    },
    {
      id: 'req-3',
      type: 'menu_availability',
      requestor_id: 'staff-1',
      requestor_name: 'John Kitchen',
      entity_id: 'item-2',
      entity_name: 'Lobster Thermidor',
      current_value: false,
      requested_value: true,
      reason: 'Fresh lobster shipment arrived',
      status: 'approved',
      created_at: '2024-01-15T08:45:00Z',
      urgency: 'high'
    },
    {
      id: 'req-4',
      type: 'new_item',
      requestor_id: 'staff-3',
      requestor_name: 'Sarah Bar',
      entity_id: 'new',
      entity_name: 'Tropical Fruit Smoothie',
      current_value: null,
      requested_value: {
        name: 'Tropical Fruit Smoothie',
        category: 'Beverages',
        description: 'Blend of mango, pineapple, and coconut with fresh mint',
        base_price: 1200,
        prep_time_mins: 5,
        available: true,
        inventory_tracked: false,
        stations: ['bar', 'cold']
      },
      reason: 'Popular customer request for healthy drink options',
      status: 'pending',
      created_at: '2024-01-14T16:20:00Z',
      urgency: 'low'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_change': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'menu_availability': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'new_item': return <Plus className="h-4 w-4 text-purple-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredRequests = approvalRequests.filter(request => {
    const matchesSearch = request.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const processedRequests = filteredRequests.filter(r => r.status !== 'pending');

  const handleApprove = async (requestId: string, approverNotes?: string) => {
    setApprovalRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const }
          : req
      )
    );
    
    toast({
      title: "Request Approved",
      description: "The approval request has been processed successfully.",
    });
  };

  const handleReject = async (requestId: string, reason: string) => {
    setApprovalRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const }
          : req
      )
    );
    
    toast({
      title: "Request Rejected",
      description: "The request has been rejected and the requestor has been notified.",
    });
  };

  const stats = {
    pending: approvalRequests.filter(r => r.status === 'pending').length,
    approved: approvalRequests.filter(r => r.status === 'approved').length,
    rejected: approvalRequests.filter(r => r.status === 'rejected').length,
    newItems: approvalRequests.filter(r => r.type === 'new_item').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Approval Center</h1>
          <p className="text-muted-foreground">Review and approve restaurant operations requests</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Items</p>
                <p className="text-2xl font-bold text-purple-600">{stats.newItems}</p>
              </div>
              <Plus className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="new_item">New Items</SelectItem>
            <SelectItem value="price_change">Price Changes</SelectItem>
            <SelectItem value="menu_availability">Availability</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Approval Requests */}
      <Tabs defaultValue="pending" className="space-y-6">
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
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No pending approval requests at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(request => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(request.type)}
                        <div>
                          <CardTitle className="text-lg">{request.entity_name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Requested by {request.requestor_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getUrgencyColor(request.urgency)}>
                          {request.urgency} priority
                        </Badge>
                        <Badge variant="outline">
                          {request.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    
                    {request.type === 'new_item' && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Category:</span> {request.requested_value?.category}
                          </div>
                          <div>
                            <span className="font-medium">Price:</span> ₦{((request.requested_value?.base_price || 0) / 100).toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Prep Time:</span> {request.requested_value?.prep_time_mins}m
                          </div>
                          <div>
                            <span className="font-medium">Stations:</span> {request.requested_value?.stations?.join(', ')}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedApproval(request)}
                      >
                        Review Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedRequests.map(request => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(request.type)}
                      <div>
                        <CardTitle className="text-lg">{request.entity_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Requested by {request.requestor_name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge variant="outline">
                        {request.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      {selectedApproval && (
        <ApprovalDialog
          isOpen={!!selectedApproval}
          onClose={() => setSelectedApproval(null)}
          request={selectedApproval}
          canApprove={true}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}