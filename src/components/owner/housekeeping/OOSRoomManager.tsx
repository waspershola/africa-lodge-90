import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  AlertTriangle,
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface OOSRoom {
  id: string;
  roomNumber: string;
  reason: 'maintenance' | 'deep-cleaning' | 'renovation' | 'damage' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'in-progress' | 'resolved';
  reportedBy: string;
  reportedAt: Date;
  expectedResolution: Date;
  actualResolution?: Date;
  description: string;
  notes?: string;
  assignedTo?: string;
  cost?: number;
  images?: string[];
}

export default function OOSRoomManager() {
  const [showNewOOS, setShowNewOOS] = useState(false);
  const [selectedOOS, setSelectedOOS] = useState<OOSRoom | null>(null);
  const [showOOSDetails, setShowOOSDetails] = useState(false);
  const [newOOSData, setNewOOSData] = useState({
    roomNumber: '',
    reason: 'maintenance' as const,
    priority: 'medium' as const,
    description: '',
    expectedResolution: new Date(),
    assignedTo: '',
    notes: ''
  });

  // Mock OOS rooms data
  const oosRooms: OOSRoom[] = [
    {
      id: 'oos-1',
      roomNumber: '301',
      reason: 'maintenance',
      priority: 'high',
      status: 'in-progress',
      reportedBy: 'John Manager',
      reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      expectedResolution: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      description: 'Air conditioning unit needs replacement',
      assignedTo: 'Tech Services Ltd',
      cost: 450000,
      notes: 'Contacted vendor, parts ordered'
    },
    {
      id: 'oos-2',
      roomNumber: '205',
      reason: 'deep-cleaning',
      priority: 'medium',
      status: 'active',
      reportedBy: 'Sarah Staff',
      reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      expectedResolution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // day after tomorrow
      description: 'Deep cleaning after extended stay guest checkout',
      assignedTo: 'Maria Santos'
    },
    {
      id: 'oos-3',
      roomNumber: '415',
      reason: 'damage',
      priority: 'urgent',
      status: 'active',
      reportedBy: 'Night Security',
      reportedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      expectedResolution: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      description: 'Water damage from broken pipe in bathroom',
      notes: 'Emergency plumber called, guests evacuated'
    }
  ];

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'maintenance': return 'bg-primary/10 text-primary border-primary/20';
      case 'deep-cleaning': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'renovation': return 'bg-success/10 text-success border-success/20';
      case 'damage': return 'bg-destructive/10 text-destructive border-destructive/20';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'in-progress': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'resolved': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleCreateOOS = () => {
    // Handle OOS creation
    console.log('Creating OOS:', newOOSData);
    setShowNewOOS(false);
    setNewOOSData({
      roomNumber: '',
      reason: 'maintenance',
      priority: 'medium',
      description: '',
      expectedResolution: new Date(),
      assignedTo: '',
      notes: ''
    });
  };

  const handleViewOOS = (oos: OOSRoom) => {
    setSelectedOOS(oos);
    setShowOOSDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Out-of-Service Rooms</h2>
          <p className="text-muted-foreground">Track and manage rooms temporarily unavailable</p>
        </div>
        <Button onClick={() => setShowNewOOS(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Mark Room OOS
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="luxury-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{oosRooms.filter(r => r.status === 'active').length}</div>
                <div className="text-sm text-muted-foreground">Active OOS</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{oosRooms.filter(r => r.status === 'in-progress').length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Resolved This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OOS Rooms List */}
      <div className="grid gap-4">
        {oosRooms.map((oos) => (
          <Card key={oos.id} className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">Room {oos.roomNumber}</h3>
                      <Badge className={getStatusColor(oos.status)} variant="outline">
                        {oos.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(oos.priority)} variant="outline">
                        {oos.priority.toUpperCase()}
                      </Badge>
                      <Badge className={getReasonColor(oos.reason)} variant="outline">
                        {oos.reason.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {oos.description}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Reported: {format(oos.reportedAt, 'MMM dd, HH:mm')}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        Expected: {format(oos.expectedResolution, 'MMM dd, HH:mm')}
                      </div>
                      {oos.assignedTo && (
                        <div>Assigned to: {oos.assignedTo}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewOOS(oos)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                  {oos.status !== 'resolved' && (
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {oosRooms.length === 0 && (
        <Card className="luxury-card">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
            <div className="text-lg font-medium mb-2">All rooms are operational</div>
            <div className="text-muted-foreground">No out-of-service rooms at the moment</div>
          </CardContent>
        </Card>
      )}

      {/* New OOS Dialog */}
      {showNewOOS && (
        <Dialog open={true} onOpenChange={() => setShowNewOOS(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Mark Room Out-of-Service
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Room Number *</Label>
                <Input
                  value={newOOSData.roomNumber}
                  onChange={(e) => setNewOOSData({...newOOSData, roomNumber: e.target.value})}
                  placeholder="e.g., 301"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reason *</Label>
                  <Select 
                    value={newOOSData.reason} 
                    onValueChange={(value: any) => setNewOOSData({...newOOSData, reason: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="deep-cleaning">Deep Cleaning</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority *</Label>
                  <Select 
                    value={newOOSData.priority} 
                    onValueChange={(value: any) => setNewOOSData({...newOOSData, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={newOOSData.description}
                  onChange={(e) => setNewOOSData({...newOOSData, description: e.target.value})}
                  placeholder="Describe the issue..."
                  className="min-h-20"
                />
              </div>

              <div>
                <Label>Expected Resolution Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newOOSData.expectedResolution, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newOOSData.expectedResolution}
                      onSelect={(date) => date && setNewOOSData({...newOOSData, expectedResolution: date})}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Assign To</Label>
                <Input
                  value={newOOSData.assignedTo}
                  onChange={(e) => setNewOOSData({...newOOSData, assignedTo: e.target.value})}
                  placeholder="Staff member or vendor"
                />
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={newOOSData.notes}
                  onChange={(e) => setNewOOSData({...newOOSData, notes: e.target.value})}
                  placeholder="Any additional information..."
                  className="min-h-16"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateOOS} className="flex-1">
                Mark Out-of-Service
              </Button>
              <Button variant="outline" onClick={() => setShowNewOOS(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* OOS Details Dialog */}
      {showOOSDetails && selectedOOS && (
        <Dialog open={true} onOpenChange={() => setShowOOSDetails(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Room {selectedOOS.roomNumber} - OOS Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <Badge className={getStatusColor(selectedOOS.status)} variant="outline">
                    {selectedOOS.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Priority</div>
                  <Badge className={getPriorityColor(selectedOOS.priority)} variant="outline">
                    {selectedOOS.priority.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Reason</div>
                  <Badge className={getReasonColor(selectedOOS.reason)} variant="outline">
                    {selectedOOS.reason.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Description</div>
                <div className="text-sm bg-muted/50 p-3 rounded">{selectedOOS.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Reported By</div>
                  <div>{selectedOOS.reportedBy}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Reported At</div>
                  <div>{format(selectedOOS.reportedAt, 'PPpp')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Expected Resolution</div>
                  <div>{format(selectedOOS.expectedResolution, 'PPpp')}</div>
                </div>
                {selectedOOS.assignedTo && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Assigned To</div>
                    <div>{selectedOOS.assignedTo}</div>
                  </div>
                )}
              </div>

              {selectedOOS.cost && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Estimated Cost</div>
                  <div className="text-lg font-semibold">₦{selectedOOS.cost.toLocaleString()}</div>
                </div>
              )}

              {selectedOOS.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm bg-muted/50 p-3 rounded">{selectedOOS.notes}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              <Button variant="outline" size="sm">
                Add Update
              </Button>
              {selectedOOS.status !== 'resolved' && (
                <Button size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowOOSDetails(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}