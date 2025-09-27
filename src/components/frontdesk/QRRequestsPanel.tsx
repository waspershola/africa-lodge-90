import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Smartphone, 
  Clock, 
  CheckCircle,
  User,
  MapPin,
  MessageSquare,
  Coffee,
  Utensils,
  Bed,
  Car,
  Shield,
  Wrench,
  AlertCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQRRealtime } from "@/hooks/useQRRealtime";

interface QRRequest {
  id: string;
  room: string;
  guestName: string;
  type: 'amenity' | 'service' | 'maintenance' | 'housekeeping';
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  requestedAt: Date;
  assignedTo?: string;
  completedAt?: Date;
  estimatedTime?: number; // minutes
  specialInstructions?: string;
  qrToken: string;
}

const mockQRRequests: QRRequest[] = [
  {
    id: '1',
    room: '305',
    guestName: 'Sarah Johnson',
    type: 'amenity',
    category: 'Towels & Linens',
    description: '2 extra bath towels, 1 bathrobe',
    priority: 'medium',
    status: 'pending',
    requestedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    estimatedTime: 15,
    qrToken: 'QR_REQ_305_001'
  },
  {
    id: '2',
    room: '201',
    guestName: 'Mike Chen',    
    type: 'service',
    category: 'Room Service',
    description: 'Coffee and pastries for 2 people',
    priority: 'low',
    status: 'assigned',
    requestedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    assignedTo: 'Room Service Staff',
    estimatedTime: 20,
    specialInstructions: 'Guest prefers decaf coffee',
    qrToken: 'QR_REQ_201_002'
  },
  {
    id: '3',
    room: '410',
    guestName: 'David Wilson',
    type: 'maintenance',
    category: 'AC/Heating',
    description: 'Air conditioning too cold, cannot adjust temperature',
    priority: 'high',
    status: 'in-progress',
    requestedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    assignedTo: 'Mike Chen (Maintenance)',
    estimatedTime: 30,
    qrToken: 'QR_REQ_410_003'
  },
  {
    id: '4',
    room: '150',
    guestName: 'Amara Okafor',
    type: 'housekeeping',
    category: 'Cleaning',
    description: 'Room cleaning - guest stepped out',
    priority: 'medium',
    status: 'completed',
    requestedAt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
    assignedTo: 'Sarah Johnson (Housekeeping)',
    completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    qrToken: 'QR_REQ_150_004'
  }
];

const requestTypes = {
  amenity: { 
    icon: Coffee, 
    color: 'bg-blue-100 text-blue-800',
    categories: ['Towels & Linens', 'Toiletries', 'Pillows & Bedding', 'Mini Bar Items', 'Electronics']
  },
  service: { 
    icon: Utensils, 
    color: 'bg-green-100 text-green-800',
    categories: ['Room Service', 'Laundry', 'Concierge', 'Transportation', 'Wake-up Call']
  },
  maintenance: { 
    icon: Wrench, 
    color: 'bg-orange-100 text-orange-800',
    categories: ['AC/Heating', 'Plumbing', 'Electrical', 'TV/Electronics', 'Furniture']
  },
  housekeeping: { 
    icon: Bed, 
    color: 'bg-purple-100 text-purple-800',
    categories: ['Cleaning', 'Bed Making', 'Trash Removal', 'Restocking', 'Deep Clean']
  }
};

export const QRRequestsPanel = () => {
  const { orders: qrOrders, loading, updateOrderStatus, assignOrder } = useQRRealtime();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  // Convert QR orders to request format
  const requests: QRRequest[] = qrOrders.map(order => ({
    id: order.id,
    room: order.room_id ? `${order.room_id}` : 'General',
    guestName: 'Guest',
    type: order.service_type === 'restaurant' ? 'service' : 
          order.service_type === 'housekeeping' ? 'housekeeping' :
          order.service_type === 'maintenance' ? 'maintenance' : 'amenity',
    category: order.service_type,
    description: order.request_details || 'Service request',
    priority: order.priority === 1 ? 'low' : 
              order.priority === 2 ? 'medium' : 
              order.priority === 3 ? 'high' : 'urgent',
    status: order.status as QRRequest['status'],
    requestedAt: new Date(order.created_at),
    assignedTo: order.assigned_to || undefined,
    completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
    estimatedTime: 30, // Default estimate
    specialInstructions: order.notes || undefined,
    qrToken: order.qr_code_id || 'QR_TOKEN'
  }));

  const getRequestIcon = (type: QRRequest['type']) => {
    const IconComponent = requestTypes[type].icon;
    return <IconComponent className="h-4 w-4" />;
  };

  const getRequestTypeColor = (type: QRRequest['type']) => {
    return requestTypes[type].color;
  };

  const getPriorityColor = (priority: QRRequest['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: QRRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAssignRequest = async (requestId: string) => {
    const success = await assignOrder(requestId, 'Front Desk Staff');
    if (success) {
      toast({
        title: "Request Assigned",
        description: "Request has been assigned to staff member"
      });
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    const success = await updateOrderStatus(requestId, 'completed');
    if (success) {
      toast({
        title: "Request Completed",
        description: "Request has been marked as completed"
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const success = await updateOrderStatus(requestId, 'cancelled');
    if (success) {
      toast({
        title: "Request Cancelled",
        description: "Request has been cancelled"
      });
    }
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesType = filterType === 'all' || req.type === filterType;
    return matchesStatus && matchesType;
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in-progress' || r.status === 'assigned');
  const completedToday = requests.filter(r => 
    r.status === 'completed' && 
    r.completedAt && 
    new Date(r.completedAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
            <div className="text-sm text-yellow-700">Pending Requests</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressRequests.length}</div>
            <div className="text-sm text-blue-700">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedToday.length}</div>
            <div className="text-sm text-green-700">Completed Today</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(requests.filter(r => r.estimatedTime).reduce((sum, r) => sum + (r.estimatedTime || 0), 0) / (requests.filter(r => r.estimatedTime).length || 1))}m
            </div>
            <div className="text-sm text-purple-700">Avg Response Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="font-medium">QR Requests:</span>
            </div>
            <div className="flex gap-4 flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="amenity">Amenities</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent/High Priority Alert */}
      {filteredRequests.some(r => r.priority === 'urgent' || r.priority === 'high') && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              High Priority Requests ({filteredRequests.filter(r => r.priority === 'urgent' || r.priority === 'high').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredRequests
                .filter(r => r.priority === 'urgent' || r.priority === 'high')
                .map(request => (
                  <div key={request.id} className="p-3 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority.toUpperCase()}
                        </Badge>
                        <span className="font-medium">Room {request.room}</span>
                        <span className="text-sm">{request.description}</span>
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <Button size="sm" onClick={() => handleAssignRequest(request.id)}>
                            Assign Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className={request.priority === 'urgent' ? 'border-red-200' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getRequestTypeColor(request.type)}>
                      {getRequestIcon(request.type)}
                      <span className="ml-1">{request.type.toUpperCase()}</span>
                    </Badge>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status === 'in-progress' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {request.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      Room {request.room}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {request.guestName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{request.guestName}</h3>
                      <p className="text-sm text-muted-foreground">{request.category}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-2">{request.description}</p>
                  {request.specialInstructions && (
                    <p className="text-sm text-blue-600 mb-2">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {request.specialInstructions}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(request.requestedAt)}
                    </span>
                    {request.estimatedTime && (
                      <span>Est. {request.estimatedTime}min</span>
                    )}
                    {request.assignedTo && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {request.assignedTo}
                      </span>
                    )}
                    {request.completedAt && (
                      <span>Completed: {request.completedAt.toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {request.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleAssignRequest(request.id)}>
                        Assign
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCancelRequest(request.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {(request.status === 'assigned' || request.status === 'in-progress') && (
                    <Button size="sm" onClick={() => handleCompleteRequest(request.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  {request.status === 'completed' && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No QR Requests</h3>
            <p className="text-muted-foreground">
              No guest requests found matching your filters. QR requests will appear here when guests scan room QR codes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};