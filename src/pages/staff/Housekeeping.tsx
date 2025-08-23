import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  Play,
  Pause,
  MessageSquare,
  Camera,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface HousekeepingTask {
  id: string;
  roomNumber: string;
  type: 'cleaning' | 'maintenance' | 'inspection';
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  dueTime: Date;
  estimatedDuration: number;
  checklist: ChecklistItem[];
  notes?: string;
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  required: boolean;
}

export default function StaffHousekeepingPage() {
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  // Mock current staff member (replace with auth context)
  const currentStaff = {
    id: 'staff-1',
    name: 'Maria Santos',
    role: 'housekeeper'
  };

  // Mock tasks assigned to current staff member
  const myTasks: HousekeepingTask[] = [
    {
      id: 'task-1',
      roomNumber: '301',
      type: 'cleaning',
      status: 'pending',
      priority: 'high',
      description: 'Post-checkout cleaning',
      dueTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      estimatedDuration: 45,
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
      roomNumber: '205',
      type: 'cleaning',
      status: 'in-progress',
      priority: 'medium',
      description: 'Daily housekeeping',
      dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      estimatedDuration: 30,
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
      id: 'task-3',
      roomNumber: '102',
      type: 'cleaning',
      status: 'completed',
      priority: 'medium',
      description: 'Post-checkout cleaning',
      dueTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      estimatedDuration: 45,
      checklist: [
        { id: 'c1', task: 'Strip and remake beds', completed: true, required: true },
        { id: 'c2', task: 'Clean bathroom thoroughly', completed: true, required: true },
        { id: 'c3', task: 'Vacuum carpets and floors', completed: true, required: true },
        { id: 'c4', task: 'Dust all surfaces', completed: true, required: true },
        { id: 'c5', task: 'Restock amenities', completed: true, required: true },
        { id: 'c6', task: 'Check and replace towels', completed: true, required: true },
        { id: 'c7', task: 'Empty trash bins', completed: true, required: true },
        { id: 'c8', task: 'Final quality check', completed: true, required: true }
      ]
    }
  ];

  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'in-progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
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
      case 'in-progress': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStartTask = (task: HousekeepingTask) => {
    console.log('Starting task:', task.id);
    // Update task status to in-progress
  };

  const handleCompleteTask = (task: HousekeepingTask) => {
    console.log('Completing task:', task.id);
    // Update task status to completed
  };

  const handleUpdateChecklist = (taskId: string, checklistItemId: string, completed: boolean) => {
    console.log('Updating checklist:', { taskId, checklistItemId, completed });
    // Update checklist item status
  };

  const handleViewTask = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
    setTaskNotes(task.notes || '');
  };

  const getCompletionPercentage = (checklist: ChecklistItem[]) => {
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">My Tasks</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {currentStaff.name}</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-warning-foreground">{pendingTasks.length}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-primary">{inProgressTasks.length}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 space-y-4">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning-foreground" />
              Pending Tasks
            </h2>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-warning">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">Room {task.roomNumber}</span>
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">{task.description}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Due: {format(task.dueTime, 'HH:mm')}
                          <Clock className="h-3 w-3 ml-2" />
                          {task.estimatedDuration}min
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleStartTask(task)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Task
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewTask(task)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              In Progress
            </h2>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">Room {task.roomNumber}</span>
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">{task.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Progress: {getCompletionPercentage(task.checklist)}% complete
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewTask(task)}
                      >
                        Continue
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleCompleteTask(task)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recently Completed */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Recently Completed
            </h2>
            <div className="space-y-3">
              {completedTasks.slice(0, 3).map((task) => (
                <Card key={task.id} className="border-l-4 border-l-success opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Room {task.roomNumber}</span>
                      <Badge className={getStatusColor(task.status)} variant="outline">
                        Completed
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal/Bottom Sheet would go here */}
      {/* For mobile, this would typically be a full-screen modal or bottom sheet */}
      
      {myTasks.length === 0 && (
        <div className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
          <div className="text-lg font-medium mb-2">All caught up!</div>
          <div className="text-muted-foreground">No tasks assigned at the moment</div>
        </div>
      )}
    </div>
  );
}