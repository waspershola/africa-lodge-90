import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Calendar,
  Search,
  Plus,
  Wrench,
  CheckCircle,
  Timer,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface OOSRoom {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  status: 'maintenance' | 'deep-cleaning' | 'renovation' | 'equipment-failure' | 'damage';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reportedBy: string;
  reportedAt: Date;
  expectedResolution: Date;
  actualResolution?: Date;
  reason: string;
  description: string;
  assignedTo?: string;
  department: 'housekeeping' | 'maintenance' | 'management';
  notes?: string;
  estimatedRevenueLoss: number;
  photos?: string[];
}

export default function OOSRoomsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<OOSRoom | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showNewOOSForm, setShowNewOOSForm] = useState(false);

  // Mock OOS rooms data
  const oosRooms: OOSRoom[] = [
    {
      id: 'oos-1',
      roomNumber: '305',
      floor: 3,
      roomType: 'Deluxe',
      status: 'equipment-failure',
      priority: 'urgent',
      reportedBy: 'Maria Santos',
      reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      expectedResolution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      reason: 'Air Conditioning System Failure',
      description: 'AC unit not cooling properly, making strange noises. Guest complaint received.',
      assignedTo: 'Mike Wilson (Maintenance)',
      department: 'maintenance',
      estimatedRevenueLoss: 25000,
      notes: 'Waiting for replacement parts. Guest relocated to room 320.'
    },
    {
      id: 'oos-2',
      roomNumber: '112',
      floor: 1,
      roomType: 'Standard',
      status: 'deep-cleaning',
      priority: 'medium',
      reportedBy: 'John Martinez',
      reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      expectedResolution: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      reason: 'Biohazard Cleaning Required',
      description: 'Deep sanitization required after medical incident in room.',
      assignedTo: 'Sarah Johnson (Housekeeping)',
      department: 'housekeeping',
      estimatedRevenueLoss: 15000,
      notes: 'Special cleaning protocol in progress. Room sealed for safety.'
    },
    {
      id: 'oos-3',
      roomNumber: '408',
      floor: 4,
      roomType: 'Suite',
      status: 'maintenance',
      priority: 'high',
      reportedBy: 'Front Desk',
      reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      expectedResolution: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      reason: 'Plumbing Issues',
      description: 'Water leak in bathroom ceiling, possible pipe burst above.',
      assignedTo: 'Emergency Plumber',
      department: 'maintenance',
      estimatedRevenueLoss: 45000,
      notes: 'Emergency plumber called. Checking for structural damage.'
    },
    {
      id: 'oos-4',
      roomNumber: '203',
      floor: 2,
      roomType: 'Standard',
      status: 'damage',
      priority: 'low',
      reportedBy: 'Night Security',
      reportedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
      expectedResolution: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      reason: 'Furniture Damage',
      description: 'Broken chair and damaged carpet due to guest incident.',
      assignedTo: 'Furniture Repair Team',
      department: 'maintenance',
      estimatedRevenueLoss: 12000,
      notes: 'Minor repairs needed. Waiting for furniture replacement.'
    }
  ];

  // Filter rooms
  const filteredRooms = oosRooms.filter(room => {
    const matchesSearch = 
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || room.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'maintenance': return 'bg-primary/10 text-primary border-primary/20';
      case 'deep-cleaning': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'renovation': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'equipment-failure': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'damage': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'deep-cleaning': return <AlertTriangle className="h-4 w-4" />;
      case 'renovation': return <Timer className="h-4 w-4" />;
      case 'equipment-failure': return <AlertCircle className="h-4 w-4" />;
      case 'damage': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewRoom = (room: OOSRoom) => {
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const handleResolveRoom = (roomId: string) => {
    console.log('Resolving OOS room:', roomId);
    // API call to resolve room
  };

  const handleUpdateRoom = (roomId: string, updates: any) => {
    console.log('Updating OOS room:', roomId, updates);
    // API call to update room
  };

  const isOverdue = (room: OOSRoom) => {
    return new Date() > room.expectedResolution;
  };

  const totalRevenueLoss = filteredRooms.reduce((total, room) => total + room.estimatedRevenueLoss, 0);
  const urgentRooms = filteredRooms.filter(room => room.priority === 'urgent').length;
  const overdueRooms = filteredRooms.filter(room => isOverdue(room)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Out of Service Rooms</h1>
          <p className="text-muted-foreground">Manage rooms temporarily unavailable for guests</p>
        </div>
        <Button onClick={() => setShowNewOOSForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Report OOS Room
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredRooms.length}</div>
                <div className="text-sm text-muted-foreground">Total OOS</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{urgentRooms}</div>
                <div className="text-sm text-muted-foreground">Urgent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{overdueRooms}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">₦</span>
              </div>
              <div>
                <div className="text-2xl font-bold">₦{(totalRevenueLoss / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground">Revenue Loss</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search rooms, reasons..."
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
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="deep-cleaning">Deep Cleaning</SelectItem>
                <SelectItem value="renovation">Renovation</SelectItem>
                <SelectItem value="equipment-failure">Equipment Failure</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* OOS Rooms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card 
            key={room.id} 
            className={`luxury-card cursor-pointer hover:shadow-md transition-shadow ${
              isOverdue(room) ? 'border-destructive/50 bg-destructive/5' : ''
            }`}
            onClick={() => handleViewRoom(room)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">Room {room.roomNumber}</span>
                    {isOverdue(room) && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <Badge className={getPriorityColor(room.priority)} variant="outline">
                    {room.priority}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(room.status)} variant="outline">
                    <span className="mr-1">{getStatusIcon(room.status)}</span>
                    {room.status.replace('-', ' ')}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Floor {room.floor} • {room.roomType}
                  </div>
                </div>

                <div>
                  <div className="font-medium">{room.reason}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {room.description}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3" />
                    <span>Reported by: {room.reportedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Expected resolution: {format(room.expectedResolution, 'MMM dd, HH:mm')}</span>
                    {isOverdue(room) && (
                      <span className="text-destructive font-medium">(Overdue)</span>
                    )}
                  </div>
                </div>

                {room.assignedTo && (
                  <div className="text-xs text-muted-foreground">
                    Assigned to: {room.assignedTo}
                  </div>
                )}

                <div className="text-sm">
                  <span className="text-muted-foreground">Revenue Impact: </span>
                  <span className="font-medium text-orange-600">₦{room.estimatedRevenueLoss.toLocaleString()}</span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1" onClick={(e) => {
                    e.stopPropagation();
                    handleResolveRoom(room.id);
                  }}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => {
                    e.stopPropagation();
                    handleViewRoom(room);
                  }}>
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <Card className="luxury-card">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
            <div className="text-lg font-medium mb-2">No OOS rooms found</div>
            <div className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your filters'
                : 'All rooms are currently in service'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Details Dialog */}
      <Dialog open={showRoomDetails} onOpenChange={setShowRoomDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRoom && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getStatusIcon(selectedRoom.status)}
                  Room {selectedRoom.roomNumber} - OOS Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(selectedRoom.status)} variant="outline">
                    {selectedRoom.status.replace('-', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(selectedRoom.priority)} variant="outline">
                    {selectedRoom.priority}
                  </Badge>
                  {isOverdue(selectedRoom) && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Room Type:</span>
                    <div className="font-medium">{selectedRoom.roomType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Floor:</span>
                    <div className="font-medium">{selectedRoom.floor}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <div className="font-medium capitalize">{selectedRoom.department}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reported By:</span>
                    <div className="font-medium">{selectedRoom.reportedBy}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reported At:</span>
                    <div className="font-medium">{format(selectedRoom.reportedAt, 'MMM dd, yyyy HH:mm')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Resolution:</span>
                    <div className={`font-medium ${isOverdue(selectedRoom) ? 'text-destructive' : ''}`}>
                      {format(selectedRoom.expectedResolution, 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">Reason:</span>
                  <div className="font-medium mt-1">{selectedRoom.reason}</div>
                </div>

                <div>
                  <span className="text-muted-foreground">Description:</span>
                  <div className="mt-1">{selectedRoom.description}</div>
                </div>

                {selectedRoom.assignedTo && (
                  <div>
                    <span className="text-muted-foreground">Assigned To:</span>
                    <div className="font-medium mt-1">{selectedRoom.assignedTo}</div>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">Estimated Revenue Loss:</span>
                  <div className="font-medium text-orange-600 mt-1">₦{selectedRoom.estimatedRevenueLoss.toLocaleString()}</div>
                </div>

                {selectedRoom.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <div className="mt-1 p-3 bg-muted/30 rounded-lg">{selectedRoom.notes}</div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => handleResolveRoom(selectedRoom.id)} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Mark Resolved
                  </Button>
                  <Button variant="outline" onClick={() => handleUpdateRoom(selectedRoom.id, {})}>
                    Update Status
                  </Button>
                  <Button variant="outline">
                    View History
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