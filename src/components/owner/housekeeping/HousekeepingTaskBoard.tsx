import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search,
  Filter,
  Plus,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin
} from 'lucide-react';
import { useHousekeepingTasks } from '@/hooks/useApi';
import { format } from 'date-fns';

interface Task {
  id: string;
  roomNumber: string;
  type: 'cleaning' | 'maintenance' | 'deep-clean' | 'inspection';
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedStaff: string;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  description: string;
  checkoutId?: string;
  estimatedDuration: number;
  notes?: string;
}

export default function HousekeepingTaskBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  // Mock data - replace with API call
  const tasks: Task[] = [
    {
      id: 'task-1',
      roomNumber: '301',
      type: 'cleaning',
      status: 'pending',
      priority: 'high',
      assignedTo: 'staff-1',
      assignedStaff: 'Maria Santos',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      description: 'Post-checkout cleaning',
      checkoutId: 'checkout-123',
      estimatedDuration: 45,
      notes: 'Guest reported spilled coffee in bedroom'
    },
    {
      id: 'task-2',
      roomNumber: '205',
      type: 'maintenance',
      status: 'in-progress',
      priority: 'medium',
      assignedTo: 'staff-2',
      assignedStaff: 'John Doe',
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      description: 'Fix leaky faucet in bathroom',
      estimatedDuration: 60
    },
    {
      id: 'task-3',
      roomNumber: '102',
      type: 'cleaning',
      status: 'completed',
      priority: 'medium',
      assignedTo: 'staff-1',
      assignedStaff: 'Maria Santos',
      dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 60 * 1000),
      description: 'Post-checkout cleaning',
      estimatedDuration: 45
    },
    {
      id: 'task-4',
      roomNumber: '415',
      type: 'deep-clean',
      status: 'delayed',
      priority: 'urgent',
      assignedTo: 'staff-3',
      assignedStaff: 'Sarah Johnson',
      dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours overdue
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      description: 'Deep cleaning after extended stay',
      estimatedDuration: 120
    }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.roomNumber.includes(searchTerm) || 
                         task.assignedStaff.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesStaff = filterStaff === 'all' || task.assignedTo === filterStaff;
    
    return matchesSearch && matchesStatus && matchesType && matchesStaff;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'delayed': return 'bg-destructive/10 text-destructive border-destructive/20';
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
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <Calendar className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'delayed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    delayed: filteredTasks.filter(t => t.status === 'delayed')
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="luxury-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room, staff, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="deep-clean">Deep Clean</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <Card key={status} className="luxury-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getStatusIcon(status)}
                {status.replace('-', ' ').toUpperCase()}
                <Badge variant="secondary" className="ml-auto">
                  {statusTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
                  onClick={() => handleViewTask(task)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">Room {task.roomNumber}</span>
                      </div>
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {task.description}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {task.assignedStaff}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Due: {format(task.dueDate, 'MMM dd, HH:mm')}
                      </span>
                      <Badge className={getStatusColor(task.status)} variant="outline">
                        {task.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
              
              {statusTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm">No {status.replace('-', ' ')} tasks</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Details Dialog */}
      {showTaskDetails && selectedTask && (
        <Dialog open={true} onOpenChange={() => setShowTaskDetails(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Room {selectedTask.roomNumber} - {selectedTask.description}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <Badge className={getStatusColor(selectedTask.status)} variant="outline">
                    {selectedTask.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Priority</div>
                  <Badge className={getPriorityColor(selectedTask.priority)} variant="outline">
                    {selectedTask.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Assigned To</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedTask.assignedStaff}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Type</div>
                  <div className="capitalize">{selectedTask.type.replace('-', ' ')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Due Date</div>
                  <div>{format(selectedTask.dueDate, 'PPpp')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Estimated Duration</div>
                  <div>{selectedTask.estimatedDuration} minutes</div>
                </div>
              </div>

              {selectedTask.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm bg-muted/50 p-3 rounded">{selectedTask.notes}</div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  Reassign
                </Button>
                <Button variant="outline" size="sm">
                  Edit Task
                </Button>
                <Button size="sm">
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}