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
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
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
  Search,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { format } from 'date-fns';
import { useHousekeepingTasks, HousekeepingTask, ChecklistItem } from '@/hooks/useHousekeepingApi';

export default function ProductionTasksBoard() {
  const { tasks, loading, error, acceptTask, completeTask, refreshTasks } = useHousekeepingTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [taskNotes, setTaskNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const handleViewTask = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
    setTaskNotes(task.notes || '');
  };

  const handleAcceptTask = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      await acceptTask(taskId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      await completeTask(taskId, taskNotes);
      setShowTaskDetails(false);
    } finally {
      setActionLoading(null);
    }
  };

  const getCompletionPercentage = (checklist: ChecklistItem[] = []) => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingState message="Loading tasks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <ErrorState 
          message={error}
          onRetry={refreshTasks}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks Board</h1>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">Manage housekeeping tasks and amenity requests</p>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-success">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-warning-foreground">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshTasks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Online/Offline Status Banner */}
      {!isOnline && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-warning-foreground" />
              <div>
                <div className="font-medium text-warning-foreground">Offline Mode</div>
                <div className="text-sm text-muted-foreground">
                  Your actions will be synced when connection is restored.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Progress: {getCompletionPercentage(task.checklist)}% complete
                              </div>
                              <Progress value={getCompletionPercentage(task.checklist)} className="h-1" />
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
                              <Button 
                                size="sm" 
                                className="flex-1" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptTask(task.id);
                                }}
                                disabled={actionLoading === task.id}
                              >
                                {actionLoading === task.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Accept'
                                )}
                              </Button>
                            </div>
                          )}

                          {task.status === 'in-progress' && (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteTask(task.id);
                                }}
                                disabled={actionLoading === task.id}
                              >
                                {actionLoading === task.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Complete'
                                )}
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
                    <div className="flex items-center gap-4 flex-1">
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
                      <span className="text-sm text-muted-foreground flex-1">{task.description}</span>
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
                  {!isOnline && (
                    <Badge variant="outline" className="bg-warning/10 text-warning-foreground">
                      Offline
                    </Badge>
                  )}
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
                      <Button 
                        onClick={() => handleAcceptTask(selectedTask.id)} 
                        className="flex items-center gap-2"
                        disabled={actionLoading === selectedTask.id}
                      >
                        {actionLoading === selectedTask.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Accept Task
                      </Button>
                      <Button variant="outline">
                        Reassign
                      </Button>
                    </>
                  )}
                  
                  {selectedTask.status === 'in-progress' && (
                    <>
                      <Button 
                        onClick={() => handleCompleteTask(selectedTask.id)} 
                        className="flex items-center gap-2"
                        disabled={actionLoading === selectedTask.id}
                      >
                        {actionLoading === selectedTask.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
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