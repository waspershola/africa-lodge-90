import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Calendar
} from 'lucide-react';
import { useMaintenanceApi, type WorkOrder } from '@/hooks/useMaintenanceApi';

export default function WorkOrdersBoard() {
  const { workOrders, isLoading, acceptWorkOrder, completeWorkOrder, createWorkOrder } = useMaintenanceApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('room-issues');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
      actualTime: 60 // This would be calculated from accept to complete time
    });
    setSelectedWorkOrder(null);
    setCompletionNotes('');
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setSelectedWorkOrder(workOrder)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Complete Work Order</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Work Order: {selectedWorkOrder?.workOrderNumber}</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedWorkOrder?.issue}
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor="notes">Completion Notes</Label>
                                  <Textarea
                                    id="notes"
                                    placeholder="Describe the work performed, parts used, etc."
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setSelectedWorkOrder(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => selectedWorkOrder && handleCompleteWorkOrder(selectedWorkOrder.id)}
                                    disabled={isLoading}
                                  >
                                    Mark Complete
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