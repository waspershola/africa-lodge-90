import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock,
  CheckCircle,
  MapPin,
  User,
  Calendar,
  Package,
  Search,
  Bell,
  MessageSquare,
  Camera,
  QrCode,
  Phone,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface AmenityRequest {
  id: string;
  roomNumber: string;
  guestName: string;
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'declined';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedAt: Date;
  dueBy?: Date;
  completedAt?: Date;
  assignedTo?: string;
  source: 'guest-qr' | 'front-desk' | 'phone' | 'concierge';
  items: AmenityItem[];
  specialInstructions?: string;
  notes?: string;
  estimatedDuration: number;
  isVip?: boolean;
}

interface AmenityItem {
  id: string;
  name: string;
  category: 'bedding' | 'bathroom' | 'food' | 'baby' | 'electronics' | 'other';
  quantity: number;
  available: boolean;
  estimatedTime: number; // minutes to deliver
}

export default function AmenityRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<AmenityRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');

  // Mock amenity requests data
  const amenityRequests: AmenityRequest[] = [
    {
      id: 'req-1',
      roomNumber: '308',
      guestName: 'Sarah Johnson',
      status: 'pending',
      priority: 'medium',
      requestedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      dueBy: new Date(Date.now() + 45 * 60 * 1000), // 45 min from now
      source: 'guest-qr',
      estimatedDuration: 20,
      items: [
        { id: 'item-1', name: 'Extra Towels', category: 'bathroom', quantity: 2, available: true, estimatedTime: 5 },
        { id: 'item-2', name: 'Baby Cot', category: 'baby', quantity: 1, available: true, estimatedTime: 15 }
      ],
      specialInstructions: 'Please deliver quietly as baby is sleeping'
    },
    {
      id: 'req-2',
      roomNumber: '205',
      guestName: 'Michael Chen',
      status: 'accepted',
      priority: 'high',
      requestedAt: new Date(Date.now() - 30 * 60 * 1000),
      dueBy: new Date(Date.now() + 30 * 60 * 1000),
      assignedTo: 'Maria Santos',
      source: 'front-desk',
      estimatedDuration: 15,
      isVip: true,
      items: [
        { id: 'item-3', name: 'Extra Pillows', category: 'bedding', quantity: 2, available: true, estimatedTime: 10 },
        { id: 'item-4', name: 'Blanket', category: 'bedding', quantity: 1, available: true, estimatedTime: 5 }
      ]
    },
    {
      id: 'req-3',
      roomNumber: '410',
      guestName: 'Emma Rodriguez',
      status: 'in-progress',
      priority: 'urgent',
      requestedAt: new Date(Date.now() - 10 * 60 * 1000),
      dueBy: new Date(Date.now() + 20 * 60 * 1000),
      assignedTo: 'Sarah Johnson',
      source: 'guest-qr',
      estimatedDuration: 30,
      isVip: true,
      items: [
        { id: 'item-5', name: 'Champagne Setup', category: 'food', quantity: 1, available: true, estimatedTime: 20 },
        { id: 'item-6', name: 'Rose Petals', category: 'other', quantity: 1, available: true, estimatedTime: 10 },
        { id: 'item-7', name: 'Extra Bath Robes', category: 'bathroom', quantity: 2, available: true, estimatedTime: 5 }
      ],
      specialInstructions: 'Anniversary celebration - please arrange elegantly'
    },
    {
      id: 'req-4',
      roomNumber: '102',
      guestName: 'David Thompson',
      status: 'completed',
      priority: 'low',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 60 * 1000),
      assignedTo: 'John Martinez',
      source: 'phone',
      estimatedDuration: 10,
      items: [
        { id: 'item-8', name: 'Iron & Board', category: 'electronics', quantity: 1, available: true, estimatedTime: 10 }
      ],
      notes: 'Delivered successfully. Guest was very satisfied.'
    },
    {
      id: 'req-5',
      roomNumber: '220',
      guestName: 'Lisa Williams',
      status: 'declined',
      priority: 'medium',
      requestedAt: new Date(Date.now() - 45 * 60 * 1000),
      source: 'guest-qr',
      estimatedDuration: 0,
      items: [
        { id: 'item-9', name: 'Pet Bed', category: 'other', quantity: 1, available: false, estimatedTime: 0 }
      ],
      notes: 'Item not available. Alternative offered via phone call.'
    }
  ];

  // Filter requests
  const filteredRequests = amenityRequests.filter(request => {
    const matchesSearch = 
      request.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority;
    const matchesSource = filterSource === 'all' || request.source === filterSource;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'accepted': return 'bg-primary/10 text-primary border-primary/20';
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'declined': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-muted text-muted-foreground border-border';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'high': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'guest-qr': return <QrCode className="h-4 w-4" />;
      case 'front-desk': return <Bell className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'concierge': return <User className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'guest-qr': return 'Guest QR';
      case 'front-desk': return 'Front Desk';
      case 'phone': return 'Phone Call';
      case 'concierge': return 'Concierge';
      default: return 'System';
    }
  };

  const handleViewRequest = (request: AmenityRequest) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
    setResponseNotes(request.notes || '');
  };

  const handleAcceptRequest = (requestId: string) => {
    console.log('Accepting request:', requestId);
    // API call to accept request
  };

  const handleDeclineRequest = (requestId: string, reason: string) => {
    console.log('Declining request:', requestId, 'Reason:', reason);
    // API call to decline request
  };

  const handleCompleteRequest = (requestId: string) => {
    console.log('Completing request:', requestId);
    // API call to complete request
  };

  const getTotalEstimatedTime = (items: AmenityItem[]) => {
    return items.reduce((total, item) => total + item.estimatedTime, 0);
  };

  const isOverdue = (request: AmenityRequest) => {
    return request.dueBy && new Date() > request.dueBy && request.status !== 'completed';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Amenity Requests</h1>
          <p className="text-muted-foreground">Manage guest amenity and service requests</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Check Inventory
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="guest-qr">Guest QR</SelectItem>
                <SelectItem value="front-desk">Front Desk</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="concierge">Concierge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRequests.map((request) => (
          <Card 
            key={request.id} 
            className={`luxury-card cursor-pointer hover:shadow-md transition-shadow ${
              isOverdue(request) ? 'border-destructive/50 bg-destructive/5' : ''
            }`}
            onClick={() => handleViewRequest(request)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Room {request.roomNumber}</span>
                    {request.isVip && (
                      <Badge variant="outline" className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700 border-amber-300">
                        VIP
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(request.priority)} variant="outline">
                      {request.priority}
                    </Badge>
                    {isOverdue(request) && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(request.status)} variant="outline">
                    {request.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getSourceIcon(request.source)}
                    <span>{getSourceLabel(request.source)}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">{request.guestName}</div>
                  <div className="text-xs text-muted-foreground">
                    Requested {format(request.requestedAt, 'HH:mm')}
                    {request.dueBy && (
                      <span> • Due {format(request.dueBy, 'HH:mm')}</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Items ({request.items.length}):</div>
                  <div className="space-y-1">
                    {request.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span>{item.name} x{item.quantity}</span>
                        <span className={item.available ? 'text-success' : 'text-destructive'}>
                          {item.available ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                    {request.items.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{request.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>

                {request.specialInstructions && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    {request.specialInstructions}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Est. {getTotalEstimatedTime(request.items)}min
                  </div>
                  {request.assignedTo && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {request.assignedTo}
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptRequest(request.id);
                    }}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      handleDeclineRequest(request.id, 'Not available');
                    }}>
                      Decline
                    </Button>
                  </div>
                )}

                {request.status === 'in-progress' && (
                  <Button size="sm" className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteRequest(request.id);
                  }}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card className="luxury-card">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium mb-2">No amenity requests found</div>
            <div className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterSource !== 'all'
                ? 'Try adjusting your filters'
                : 'New requests will appear here when guests make them'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Details Dialog */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Amenity Request - Room {selectedRequest.roomNumber}
                  {selectedRequest.isVip && (
                    <Badge variant="outline" className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700 border-amber-300">
                      VIP Guest
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(selectedRequest.status)} variant="outline">
                    {selectedRequest.status}
                  </Badge>
                  <Badge className={getPriorityColor(selectedRequest.priority)} variant="outline">
                    {selectedRequest.priority}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {getSourceIcon(selectedRequest.source)}
                    <span>{getSourceLabel(selectedRequest.source)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Guest:</span>
                    <div className="font-medium">{selectedRequest.guestName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested:</span>
                    <div className="font-medium">{format(selectedRequest.requestedAt, 'MMM dd, yyyy HH:mm')}</div>
                  </div>
                  {selectedRequest.dueBy && (
                    <div>
                      <span className="text-muted-foreground">Due By:</span>
                      <div className={`font-medium ${isOverdue(selectedRequest) ? 'text-destructive' : ''}`}>
                        {format(selectedRequest.dueBy, 'MMM dd, yyyy HH:mm')}
                        {isOverdue(selectedRequest) && ' (Overdue)'}
                      </div>
                    </div>
                  )}
                  {selectedRequest.assignedTo && (
                    <div>
                      <span className="text-muted-foreground">Assigned To:</span>
                      <div className="font-medium">{selectedRequest.assignedTo}</div>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground">Items Requested:</span>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} • Category: {item.category} • Est. {item.estimatedTime}min
                          </div>
                        </div>
                        <Badge variant={item.available ? 'outline' : 'destructive'}>
                          {item.available ? 'Available' : 'Out of Stock'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRequest.specialInstructions && (
                  <div>
                    <span className="text-muted-foreground">Special Instructions:</span>
                    <div className="mt-1 p-3 bg-muted/30 rounded-lg">{selectedRequest.specialInstructions}</div>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <Textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <Button onClick={() => handleAcceptRequest(selectedRequest.id)} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Accept Request
                      </Button>
                      <Button variant="destructive" onClick={() => handleDeclineRequest(selectedRequest.id, responseNotes)}>
                        Decline
                      </Button>
                    </>
                  )}
                  
                  {(selectedRequest.status === 'accepted' || selectedRequest.status === 'in-progress') && (
                    <>
                      <Button onClick={() => handleCompleteRequest(selectedRequest.id)} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Mark Complete
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Add Photo
                      </Button>
                    </>
                  )}

                  <Button variant="outline" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Guest
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}