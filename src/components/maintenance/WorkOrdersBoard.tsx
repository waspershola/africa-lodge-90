import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Camera,
  Wrench,
  Calendar,
  Upload,
  X
} from 'lucide-react';
import { useMaintenanceApi, type WorkOrder } from '@/hooks/useMaintenanceApi';

export default function WorkOrdersBoard() {
  const { workOrders, isLoading, acceptWorkOrder, completeWorkOrder, createWorkOrder } = useMaintenanceApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('room-issues');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [partsUsed, setPartsUsed] = useState<Array<{partName: string; quantity: number; cost: number}>>([]);
  const [newPart, setNewPart] = useState({ partName: '', quantity: 1, cost: 0 });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [newWorkOrder, setNewWorkOrder] = useState({
    roomId: '',
    facility: '',
    issue: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    estimatedTime: 60
  });

  // Filter work orders by tab
  const getFilteredWorkOrders = (tab: string) => {
    let filtered = workOrders;
    
    switch (tab) {
      case 'room-issues':
        filtered = workOrders.filter(wo => wo.roomId);
        break;
      case 'facility-issues':
        filtered = workOrders.filter(wo => wo.facility && !wo.roomId);
        break;
      case 'preventive':
        filtered = workOrders.filter(wo => wo.source === 'preventive');
        break;
      default:
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(wo => 
        wo.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.roomId && wo.roomId.includes(searchTerm)) ||
        (wo.facility && wo.facility.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'blue';
      case 'pending': return 'secondary';
      case 'escalated': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'guest-qr': return '📱';
      case 'housekeeping': return '🧹';
      case 'preventive': return '🔄';
      case 'manual': return '✏️';
      default: return '📋';
    }
  };

  const handleAcceptWorkOrder = async (workOrderId: string) => {
    await acceptWorkOrder(workOrderId, 'Current User'); // In production, get from auth
  };

  const handleCompleteWorkOrder = async (workOrderId: string) => {
    await completeWorkOrder(workOrderId, {
      notes: completionNotes,
      rootCause: rootCause,
      partsUsed: partsUsed.map(part => ({
        partId: `part-${Date.now()}-${Math.random()}`,
        partName: part.partName,
        quantity: part.quantity,
        cost: part.cost
      })),
      photos: uploadedPhotos,
      actualTime: 60 // This would be calculated from accept to complete time
    });
    setSelectedWorkOrder(null);
    setCompletionNotes('');
    setRootCause('');
    setPartsUsed([]);
    setUploadedPhotos([]);
    setShowCompleteDialog(false);
  };

  const addPart = () => {
    if (newPart.partName.trim()) {
      setPartsUsed([...partsUsed, { ...newPart }]);
      setNewPart({ partName: '', quantity: 1, cost: 0 });
    }
  };

  const removePart = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In production, you would upload to a cloud service like AWS S3, Cloudinary, etc.
      // For now, we'll simulate with placeholder URLs
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
    }
  };

  const handleCreateWorkOrder = async () => {
    try {
      await createWorkOrder(newWorkOrder);
      setShowCreateDialog(false);
      setNewWorkOrder({
        roomId: '',
        facility: '',
        issue: '',
        description: '',
        priority: 'medium',
        estimatedTime: 60
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage maintenance tasks and facility issues
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Work Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roomId">Room Number</Label>
                  <Input
                    id="roomId"
                    placeholder="e.g., 205"
                    value={newWorkOrder.roomId}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, roomId: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="facility">Facility</Label>
                  <Input
                    id="facility"
                    placeholder="e.g., Pool, Lobby"
                    value={newWorkOrder.facility}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, facility: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="issue">Issue</Label>
                <Input
                  id="issue"
                  placeholder="Brief description of the issue"
                  value={newWorkOrder.issue}
                  onChange={(e) => setNewWorkOrder({...newWorkOrder, issue: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description..."
                  value={newWorkOrder.description}
                  onChange={(e) => setNewWorkOrder({...newWorkOrder, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={newWorkOrder.priority} onValueChange={(value: any) => setNewWorkOrder({...newWorkOrder, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={newWorkOrder.estimatedTime}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, estimatedTime: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkOrder} disabled={!newWorkOrder.issue}>
                  Create Work Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search work orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Work Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="room-issues">Room Issues</TabsTrigger>
          <TabsTrigger value="facility-issues">Facility Issues</TabsTrigger>
          <TabsTrigger value="preventive">Preventive Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="room-issues" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {getFilteredWorkOrders('room-issues').map(workOrder => (
                <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getSourceIcon(workOrder.source)}</span>
                          <Badge variant={getPriorityColor(workOrder.priority) as any}>
                            {workOrder.priority}
                          </Badge>
                          <Badge variant={getStatusColor(workOrder.status) as any}>
                            {workOrder.status}
                          </Badge>
                          <span className="font-medium text-sm">{workOrder.workOrderNumber}</span>
                        </div>
                        <h3 className="font-bold text-lg">Room {workOrder.roomId}</h3>
                        <p className="font-medium text-gray-900 mb-1">{workOrder.issue}</p>
                        {workOrder.description && (
                          <p className="text-sm text-muted-foreground mb-3">{workOrder.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Requested by: {workOrder.source === 'guest-qr' ? 'Guest QR' : 
                                         workOrder.source === 'housekeeping' ? 'Housekeeping' : 'Manual'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            ETA: {workOrder.estimatedTime} min
                          </div>
                          {workOrder.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Assigned to: {workOrder.assignedTo}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(workOrder.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {workOrder.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptWorkOrder(workOrder.id)}
                            disabled={isLoading}
                          >
                            Accept
                          </Button>
                        )}
                        {workOrder.status === 'in-progress' && (
                          <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => {
                                setSelectedWorkOrder(workOrder);
                                setShowCompleteDialog(true);
                              }}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Complete Work Order - {selectedWorkOrder?.workOrderNumber}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div>
                                  <Label>Work Order Details</Label>
                                  <div className="bg-muted p-3 rounded-lg text-sm">
                                    <p><strong>Issue:</strong> {selectedWorkOrder?.issue}</p>
                                    <p><strong>Location:</strong> {selectedWorkOrder?.roomId ? `Room ${selectedWorkOrder?.roomId}` : selectedWorkOrder?.facility}</p>
                                    <p><strong>Priority:</strong> {selectedWorkOrder?.priority}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="completionNotes">Work Performed</Label>
                                  <Textarea
                                    id="completionNotes"
                                    placeholder="Describe the work performed..."
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="rootCause">Root Cause Analysis</Label>
                                  <Textarea
                                    id="rootCause"
                                    placeholder="Identify the root cause of the issue..."
                                    value={rootCause}
                                    onChange={(e) => setRootCause(e.target.value)}
                                    rows={2}
                                  />
                                </div>

                                {/* Parts Used Section */}
                                <div>
                                  <Label>Parts/Materials Used</Label>
                                  <div className="space-y-3">
                                    {partsUsed.map((part, index) => (
                                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <span className="flex-1">{part.partName}</span>
                                        <span className="text-sm">Qty: {part.quantity}</span>
                                        <span className="text-sm">${part.cost.toFixed(2)}</span>
                                        <Button size="sm" variant="ghost" onClick={() => removePart(index)}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Part name"
                                        value={newPart.partName}
                                        onChange={(e) => setNewPart({...newPart, partName: e.target.value})}
                                        className="flex-1"
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Qty"
                                        value={newPart.quantity}
                                        onChange={(e) => setNewPart({...newPart, quantity: Number(e.target.value)})}
                                        className="w-20"
                                      />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Cost"
                                        value={newPart.cost}
                                        onChange={(e) => setNewPart({...newPart, cost: Number(e.target.value)})}
                                        className="w-24"
                                      />
                                      <Button size="sm" onClick={addPart}>
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Photo Upload Section */}
                                <div>
                                  <Label>Photo Evidence (Before/After)</Label>
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      {uploadedPhotos.map((photo, index) => (
                                        <div key={index} className="relative">
                                          <img src={photo} alt={`Evidence ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 w-6 h-6 p-0"
                                            onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index))}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        id="photo-upload"
                                      />
                                      <Label htmlFor="photo-upload" className="cursor-pointer">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                          <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                          <p className="text-sm text-gray-600">Click to upload photos</p>
                                        </div>
                                      </Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                  <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => selectedWorkOrder && handleCompleteWorkOrder(selectedWorkOrder.id)}
                                    disabled={isLoading || !completionNotes.trim()}
                                  >
                                    Complete Work Order
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="facility-issues" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {getFilteredWorkOrders('facility-issues').map(workOrder => (
                <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getSourceIcon(workOrder.source)}</span>
                          <Badge variant={getPriorityColor(workOrder.priority) as any}>
                            {workOrder.priority}
                          </Badge>
                          <Badge variant={getStatusColor(workOrder.status) as any}>
                            {workOrder.status}
                          </Badge>
                          <span className="font-medium text-sm">{workOrder.workOrderNumber}</span>
                        </div>
                        <h3 className="font-bold text-lg">{workOrder.facility}</h3>
                        <p className="font-medium text-gray-900 mb-1">{workOrder.issue}</p>
                        {workOrder.description && (
                          <p className="text-sm text-muted-foreground mb-3">{workOrder.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            ETA: {workOrder.estimatedTime} min
                          </div>
                          {workOrder.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Assigned to: {workOrder.assignedTo}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(workOrder.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {workOrder.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptWorkOrder(workOrder.id)}
                            disabled={isLoading}
                          >
                            Accept
                          </Button>
                        )}
                        {workOrder.status === 'in-progress' && (
                          <Button size="sm" variant="default">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preventive" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {getFilteredWorkOrders('preventive').map(workOrder => (
                <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <Badge variant="secondary">Preventive</Badge>
                          <Badge variant={getStatusColor(workOrder.status) as any}>
                            {workOrder.status}
                          </Badge>
                          <span className="font-medium text-sm">{workOrder.workOrderNumber}</span>
                        </div>
                        <h3 className="font-bold text-lg">{workOrder.issue}</h3>
                        {workOrder.description && (
                          <p className="text-sm text-muted-foreground mb-3">{workOrder.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Location: {workOrder.facility || `Room ${workOrder.roomId}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            ETA: {workOrder.estimatedTime} min
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Scheduled: {new Date(workOrder.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {workOrder.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptWorkOrder(workOrder.id)}
                            disabled={isLoading}
                          >
                            Accept
                          </Button>
                        )}
                        {workOrder.status === 'in-progress' && (
                          <Button size="sm" variant="default">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}