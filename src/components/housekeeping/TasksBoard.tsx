import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  Play,
  Camera,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  roomNumber: string;
  type: 'cleaning' | 'amenity' | 'maintenance' | 'inspection';
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedStaff?: string;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  description: string;
  checkoutId?: string;
  estimatedDuration: number;
  notes?: string;
  checklist?: ChecklistItem[];
  source?: 'guest-qr' | 'front-desk' | 'auto' | 'manager';
  items?: string[];
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  required: boolean;
}

export default function TasksBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [taskNotes, setTaskNotes] = useState('');

  // Mock tasks data with different types
  const tasks: Task[] = [
    {
      id: 'task-1',
      roomNumber: '301',
      type: 'cleaning',
      status: 'pending',
      priority: 'high',
      assignedTo: 'Maria Santos',
      assignedStaff: 'Maria Santos',
      dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      description: 'Post-checkout deep cleaning',
      checkoutId: 'CO-001',
      estimatedDuration: 45,
      source: 'auto',
      checklist: [
        { id: 'c1', task: 'Strip and remake beds', completed: false, required: true },
        { id: 'c2', task: 'Clean bathroom thoroughly', completed: false, required: true },
        { id: 'c3', task: 'Vacuum carpets and floors', completed: false, required: true },
        { id: 'c4', task: 'Dust all surfaces', completed: false, required: true },
        { id: 'c5', task: 'Restock amenities', completed: false, required: true },
        { id: 'c6', task: 'Check and replace towels', completed: false, required: true },
        { id: 'c7', task: 'Empty trash bins', completed: false, required: true },
        { id: 'c8', task: 'Final quality check', completed: false, required: true }
      ]
    },
    {
      id: 'task-2',
      roomNumber: '308',
      type: 'amenity',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Sarah Johnson',
      assignedStaff: 'Sarah Johnson',
      dueDate: new Date(Date.now() + 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      description: 'Guest amenity delivery request',
      estimatedDuration: 15,
      source: 'guest-qr',
      items: ['Extra Towels (x2)', 'Baby Cot', 'Extra Pillows']
    },
    {
      id: 'task-3',
      roomNumber: '205',
      type: 'cleaning',
      status: 'in-progress',
      priority: 'medium',
      assignedTo: 'John Martinez',
      assignedStaff: 'John Martinez',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      description: 'Daily housekeeping service',
      estimatedDuration: 30,
      source: 'auto',
      checklist: [
        { id: 'c1', task: 'Make beds', completed: true, required: true },
        { id: 'c2', task: 'Clean bathroom', completed: true, required: true },
        { id: 'c3', task: 'Vacuum floors', completed: false, required: true },
        { id: 'c4', task: 'Dust surfaces', completed: false, required: true },
        { id: 'c5', task: 'Replace towels', completed: false, required: true },
        { id: 'c6', task: 'Empty trash', completed: false, required: true }
      ]
    },
    {
      id: 'task-4',
      roomNumber: '410',
      type: 'amenity',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'Maria Santos',
      assignedStaff: 'Maria Santos',
      dueDate: new Date(Date.now() + 20 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      description: 'VIP guest special requests',
      estimatedDuration: 20,
      source: 'front-desk',
      items: ['Champagne Setup', 'Rose Petals', 'Extra Bath Robes', 'Welcome Fruit Basket']
    },
    {
      id: 'task-5',
      roomNumber: '102',
      type: 'cleaning',
      status: 'completed',
      priority: 'medium',
      assignedTo: 'Sarah Johnson',
      assignedStaff: 'Sarah Johnson',
      dueDate: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 20 * 60 * 1000),
      description: 'Post-checkout cleaning',
      estimatedDuration: 45,
      source: 'auto',
      notes: 'Room cleaned thoroughly. Minor damage to bathroom mirror reported to maintenance.'
    },
    {
      id: 'task-6',
      roomNumber: '315',
      type: 'maintenance',
      status: 'delayed',
      priority: 'urgent',
      assignedTo: 'Maintenance Team',
      assignedStaff: 'Mike Wilson',
      dueDate: new Date(Date.now() - 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      description: 'AC repair required - room unavailable',
      estimatedDuration: 120,
      source: 'manager',
      notes: 'Waiting for replacement parts. Guest relocated to room 320.'
    }
  ];

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedStaff?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesStaff = filterStaff === 'all' || task.assignedStaff === filterStaff;
    
    return matchesSearch && matchesStatus && matchesType && matchesStaff;
  });

  // Group tasks by status
  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    delayed: filteredTasks.filter(t => t.status === 'delayed')
  };

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return <CheckCircle className="h-4 w-4" />;
      case 'amenity': return <Clock className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      case 'inspection': return <Search className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'guest-qr': return 'QR Request';
      case 'front-desk': return 'Front Desk';
      case 'auto': return 'Auto';
      case 'manager': return 'Manager';
      default: return 'System';
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
    setTaskNotes(task.notes || '');
  };

  const handleAcceptTask = (taskId: string) => {
    console.log('Accepting task:', taskId);
    // API call to accept task
  };

  const handleStartTask = (taskId: string) => {
    console.log('Starting task:', taskId);
    // API call to start task
  };

  const handleCompleteTask = (taskId: string) => {
    console.log('Completing task:', taskId);
    // API call to complete task
  };

  const handleReassignTask = (taskId: string, newAssignee: string) => {
    console.log('Reassigning task:', taskId, 'to:', newAssignee);
    // API call to reassign task
  };

  const getCompletionPercentage = (checklist: ChecklistItem[] = []) => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks Board</h1>
          <p className="text-muted-foreground">Manage housekeeping tasks and amenity requests</p>
        </div>
        <Button className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search rooms, descriptions..."
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
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="amenity">Amenity</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStaff} onValueChange={setFilterStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                <SelectItem value="John Martinez">John Martinez</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Board */}
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status} className="luxury-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {status === 'pending' && <Clock className="h-4 w-4 text-warning-foreground" />}
                    {status === 'in-progress' && <Play className="h-4 w-4 text-primary" />}
                    {status === 'completed' && <CheckCircle className="h-4 w-4 text-success" />}
                    {status === 'delayed' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    <Badge variant="outline" className="ml-auto">
                      {statusTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTasks.map((task) => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewTask(task)}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Room {task.roomNumber}</span>
                            </div>
                            <Badge className={getPriorityColor(task.priority)} variant="outline">
                              {task.priority}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getTypeIcon(task.type)}
                            <span className="text-sm capitalize">{task.type}</span>
                            <Badge variant="outline" className="text-xs">
                              {getSourceBadge(task.source || 'system')}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>

                          {task.items && (
                            <div className="text-xs text-muted-foreground">
                              Items: {task.items.join(', ')}
                            </div>
                          )}

                          {task.checklist && (
                            <div className="text-xs text-muted-foreground">
                              Progress: {getCompletionPercentage(task.checklist)}% complete
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignedStaff}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(task.dueDate, 'HH:mm')}
                            </div>
                          </div>

                          {task.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="flex-1" onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptTask(task.id);
                              }}>
                                Accept
                              </Button>
                            </div>
                          )}

                          {task.status === 'in-progress' && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline" className="flex-1" onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteTask(task.id);
                              }}>
                                Complete
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No {status.replace('-', ' ')} tasks
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card className="luxury-card">
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredTasks.map((task) => (
                  <div key={task.id} 
                    className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleViewTask(task)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(task.type)}
                        <span className="font-medium">Room {task.roomNumber}</span>
                      </div>
                      <Badge className={getStatusColor(task.status)} variant="outline">
                        {task.status}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{task.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignedStaff}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(task.dueDate, 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Room {selectedTask.roomNumber} - {selectedTask.type}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(selectedTask.status)} variant="outline">
                    {selectedTask.status}
                  </Badge>
                  <Badge className={getPriorityColor(selectedTask.priority)} variant="outline">
                    {selectedTask.priority}
                  </Badge>
                  <Badge variant="outline">
                    {getSourceBadge(selectedTask.source || 'system')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assigned To:</span>
                    <div className="font-medium">{selectedTask.assignedStaff}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Time:</span>
                    <div className="font-medium">{format(selectedTask.dueDate, 'MMM dd, yyyy HH:mm')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estimated Duration:</span>
                    <div className="font-medium">{selectedTask.estimatedDuration} minutes</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div className="font-medium">{format(selectedTask.createdAt, 'MMM dd, HH:mm')}</div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">Description:</span>
                  <div className="mt-1">{selectedTask.description}</div>
                </div>

                {selectedTask.items && (
                  <div>
                    <span className="text-muted-foreground">Items Requested:</span>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      {selectedTask.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTask.checklist && (
                  <div>
                    <span className="text-muted-foreground">Checklist ({getCompletionPercentage(selectedTask.checklist)}% complete):</span>
                    <div className="mt-2 space-y-2">
                      {selectedTask.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <Checkbox 
                            checked={item.completed}
                            onChange={() => {/* Handle checklist update */}}
                          />
                          <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                            {item.task}
                          </span>
                          {item.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <Textarea
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder="Add notes about this task..."
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3">
                  {selectedTask.status === 'pending' && (
                    <>
                      <Button onClick={() => handleAcceptTask(selectedTask.id)} className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Accept Task
                      </Button>
                      <Button variant="outline" onClick={() => handleReassignTask(selectedTask.id, 'new-assignee')}>
                        Reassign
                      </Button>
                    </>
                  )}
                  
                  {selectedTask.status === 'in-progress' && (
                    <>
                      <Button onClick={() => handleCompleteTask(selectedTask.id)} className="flex items-center gap-2">
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
                    Add Comment
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