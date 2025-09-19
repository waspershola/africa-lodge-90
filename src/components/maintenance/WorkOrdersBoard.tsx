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
  Wrench,
  Calendar,
  X
} from 'lucide-react';
import { useMaintenanceApi, type WorkOrder } from '@/hooks/useMaintenanceApi';

export default function WorkOrdersBoard() {
  const { workOrders, isLoading, acceptWorkOrder, completeWorkOrder, createWorkOrder } = useMaintenanceApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('room-issues');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [newWorkOrder, setNewWorkOrder] = useState({
    room_id: '',
    category: 'facility',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    estimated_hours: 1
  });

  // Filter work orders by tab
  const getFilteredWorkOrders = (tab: string) => {
    let filtered = workOrders;
    
    switch (tab) {
      case 'room-issues':
        filtered = workOrders.filter(wo => wo.room_id);
        break;
      case 'facility-issues':
        filtered = workOrders.filter(wo => wo.category === 'facility' && !wo.room_id);
        break;
      case 'preventive':
        filtered = workOrders.filter(wo => wo.category === 'preventive');
        break;
      default:
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(wo => 
        wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.work_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.room_id && wo.room_id.includes(searchTerm)) ||
        (wo.description && wo.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrical': return '⚡';
      case 'plumbing': return '🔧';
      case 'hvac': return '❄️';
      case 'preventive': return '🔄';
      case 'facility': return '🏢';
      default: return '📋';
    }
  };

  const handleAcceptWorkOrder = async (workOrderId: string) => {
    await acceptWorkOrder(workOrderId);
  };

  const handleCompleteWorkOrder = async (workOrderId: string) => {
    await completeWorkOrder(workOrderId, {
      notes: completionNotes
    });
    setSelectedWorkOrder(null);
    setCompletionNotes('');
    setShowCompleteDialog(false);
  };

  const handleCreateWorkOrder = async () => {
    try {
      await createWorkOrder(newWorkOrder);
      setShowCreateDialog(false);
      setNewWorkOrder({
        room_id: '',
        category: 'facility',
        title: '',
        description: '',
        priority: 'medium',
        estimated_hours: 1
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
                  <Label htmlFor="room_id">Room Number</Label>
                  <Input
                    id="room_id"
                    placeholder="e.g., 205"
                    value={newWorkOrder.room_id || ''}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, room_id: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newWorkOrder.category} onValueChange={(value) => setNewWorkOrder({...newWorkOrder, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="facility">Facility</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={newWorkOrder.title}
                  onChange={(e) => setNewWorkOrder({...newWorkOrder, title: e.target.value})}
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
                  <Label htmlFor="estimated_hours">Estimated Hours</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    step="0.5"
                    value={newWorkOrder.estimated_hours || 1}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, estimated_hours: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkOrder} disabled={!newWorkOrder.title}>
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
                <WorkOrderCard 
                  key={workOrder.id} 
                  workOrder={workOrder} 
                  onAccept={handleAcceptWorkOrder}
                  onComplete={(id) => {
                    setSelectedWorkOrder(workOrder);
                    setShowCompleteDialog(true);
                  }}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="facility-issues" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {getFilteredWorkOrders('facility-issues').map(workOrder => (
                <WorkOrderCard 
                  key={workOrder.id} 
                  workOrder={workOrder} 
                  onAccept={handleAcceptWorkOrder}
                  onComplete={(id) => {
                    setSelectedWorkOrder(workOrder);
                    setShowCompleteDialog(true);
                  }}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preventive" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {getFilteredWorkOrders('preventive').map(workOrder => (
                <WorkOrderCard 
                  key={workOrder.id} 
                  workOrder={workOrder} 
                  onAccept={handleAcceptWorkOrder}
                  onComplete={(id) => {
                    setSelectedWorkOrder(workOrder);
                    setShowCompleteDialog(true);
                  }}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Complete Work Order Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Work Order - {selectedWorkOrder?.work_order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Work Order Details</Label>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>Title:</strong> {selectedWorkOrder?.title}</p>
                <p><strong>Location:</strong> {selectedWorkOrder?.room_id ? `Room ${selectedWorkOrder?.room_id}` : selectedWorkOrder?.category}</p>
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
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedWorkOrder && handleCompleteWorkOrder(selectedWorkOrder.id)}
                disabled={isLoading || !completionNotes.trim()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Work Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Work Order Card Component
interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
  isLoading: boolean;
}

function WorkOrderCard({ workOrder, onAccept, onComplete, isLoading }: WorkOrderCardProps) {
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrical': return '⚡';
      case 'plumbing': return '🔧';
      case 'hvac': return '❄️';
      case 'preventive': return '🔄';
      case 'facility': return '🏢';
      default: return '📋';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getCategoryIcon(workOrder.category)}</span>
              <Badge variant={getPriorityColor(workOrder.priority) as any}>
                {workOrder.priority}
              </Badge>
              <Badge variant={getStatusColor(workOrder.status) as any}>
                {workOrder.status}
              </Badge>
              <span className="font-medium text-sm">{workOrder.work_order_number}</span>
            </div>
            <h3 className="font-bold text-lg">
              {workOrder.room_id ? `Room ${workOrder.room_id}` : workOrder.category.charAt(0).toUpperCase() + workOrder.category.slice(1)}
            </h3>
            <p className="font-medium text-gray-900 mb-1">{workOrder.title}</p>
            {workOrder.description && (
              <p className="text-sm text-muted-foreground mb-3">{workOrder.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Category: {workOrder.category}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ETA: {workOrder.estimated_hours || 1}h
              </div>
              {workOrder.assigned_to && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Assigned to: {workOrder.assigned_to}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Created: {new Date(workOrder.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            {workOrder.status === 'pending' && (
              <Button 
                size="sm" 
                onClick={() => onAccept(workOrder.id)}
                disabled={isLoading}
              >
                Accept
              </Button>
            )}
            {workOrder.status === 'in-progress' && (
              <Button 
                size="sm" 
                onClick={() => onComplete(workOrder.id)}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}