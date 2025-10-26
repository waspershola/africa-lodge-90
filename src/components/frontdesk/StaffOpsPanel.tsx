import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Wrench, 
  Bed, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertCircle,
  UserCheck,
  MapPin,
  Timer,
  Loader2
} from "lucide-react";
import { useStaffOperations } from "@/hooks/data/useStaffOperations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";

interface StaffMember {
  id: string;
  name: string;
  role: 'housekeeping' | 'maintenance' | 'security' | 'front-desk';
  status: 'on-duty' | 'break' | 'off-duty';
  currentTask?: string;
  currentRoom?: string;
  completedTasks: number;
  shiftStart: string;
  avatar?: string;
}

interface Task {
  id: string;
  type: 'cleaning' | 'maintenance' | 'security' | 'guest-request';
  room: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // minutes
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export const StaffOpsPanel = () => {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // USE REAL DATA from Staff Operations hook
  const { 
    staff: realStaff, 
    tasks: realTasks,
    isLoading: staffLoading,
    assignTask,
    updateTaskStatus
  } = useStaffOperations();
  
  // Fetch active shifts to determine on-duty status
  const { data: activeShifts = [] } = useQuery({
    queryKey: ['active-shifts', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('shift_sessions')
        .select('*, users(name, role)')
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'active')
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.tenant_id,
    // Phase 3: Removed polling - real-time updates handle freshness
  });
  
  // Map real staff with shift status
  const staff = useMemo<StaffMember[]>(() => {
    return realStaff.map(member => {
      const activeShift = activeShifts.find(s => s.staff_id === member.id);
      const assignedTasks = realTasks.filter(t => t.assigned_to === member.id);
      const activeTasks = assignedTasks.filter(t => t.status === 'in_progress');
      const completedTasks = assignedTasks.filter(t => t.status === 'completed');
      
      // Map role
      let role: StaffMember['role'] = 'front-desk';
      const memberRole = member.role?.toLowerCase() || '';
      if (memberRole.includes('housekeeping')) role = 'housekeeping';
      else if (memberRole.includes('maintenance')) role = 'maintenance';
      else if (memberRole.includes('security')) role = 'security';
      
      return {
        id: member.id,
        name: member.name || member.email?.split('@')[0] || 'Staff Member',
        role,
        status: activeShift ? 'on-duty' : 'off-duty',
        currentTask: activeTasks[0]?.title,
        currentRoom: activeTasks[0]?.room?.room_number, // Access room_number through room relation
        completedTasks: completedTasks.length,
        shiftStart: activeShift ? new Date(activeShift.start_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : ''
      };
    });
  }, [realStaff, activeShifts, realTasks]);
  
  // Map real tasks
  const tasks = useMemo<Task[]>(() => {
    return realTasks.map(task => {
      // Determine type
      let type: Task['type'] = 'guest-request';
      const taskType = task.task_type?.toLowerCase() || '';
      if (taskType.includes('cleaning') || taskType.includes('housekeeping')) type = 'cleaning';
      else if (taskType.includes('maintenance') || taskType.includes('repair')) type = 'maintenance';
      else if (taskType.includes('security')) type = 'security';
      
      // Map status
      let status: Task['status'] = 'pending';
      if (task.status === 'in_progress') status = 'in-progress';
      else if (task.status === 'completed') status = 'completed';
      else if (task.status === 'cancelled') status = 'blocked'; // Map cancelled to blocked for display
      
      // Map priority
      let priority: Task['priority'] = 'medium';
      const taskPriority = task.priority?.toLowerCase() || '';
      if (taskPriority === 'high') priority = 'high';
      else if (taskPriority === 'low') priority = 'low';
      else if (taskPriority === 'urgent') priority = 'urgent';
      
      return {
        id: task.id,
        type,
        room: task.room?.room_number || 'N/A', // Access room_number through room relation
        description: task.description || task.title || 'No description',
        assignedTo: task.assigned_to || '',
        status,
        priority,
        estimatedTime: task.estimated_minutes || 30,
        startedAt: task.started_at ? new Date(task.started_at) : undefined,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        notes: task.description
      };
    });
  }, [realTasks]);

  const getStaffName = (staffId: string) => {
    return staff.find(s => s.id === staffId)?.name || 'Unassigned';
  };

  const getRoleIcon = (role: StaffMember['role']) => {
    switch (role) {
      case 'housekeeping': return <Bed className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'front-desk': return <Users className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: StaffMember['status']) => {
    switch (status) {
      case 'on-duty': return 'bg-green-100 text-green-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      case 'off-duty': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskProgress = (task: Task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'in-progress' && task.startedAt) {
      const elapsed = (Date.now() - task.startedAt.getTime()) / (1000 * 60); // minutes
      return Math.min((elapsed / task.estimatedTime) * 100, 90);
    }
    return 0;
  };

  const onDutyStaff = staff.filter(s => s.status === 'on-duty');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Loading state
  if (staffLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="font-medium mb-2">Loading Staff Operations...</h3>
          <p className="text-muted-foreground">Fetching staff and task data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{onDutyStaff.length}</div>
            <div className="text-sm text-muted-foreground">Staff On Duty</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
            <div className="text-sm text-muted-foreground">Active Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
            <div className="text-sm text-muted-foreground">Pending Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {completedTasks.length}
            </div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="tasks">Task Board</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {staff.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Staff Members</h3>
                <p className="text-muted-foreground">
                  No staff members found. Staff will appear here once they start their shifts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {staff.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{member.name}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              {getRoleIcon(member.role)}
                              <span className="capitalize">{member.role.replace('-', ' ')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {member.shiftStart && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Since {member.shiftStart}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {member.completedTasks} completed
                            </span>
                            {member.currentRoom && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Room {member.currentRoom}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge className={getStatusColor(member.status)}>
                          {member.status.replace('-', ' ')}
                        </Badge>
                        {member.currentTask && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {member.currentTask}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Tasks</h3>
                <p className="text-muted-foreground">
                  No tasks found. Tasks will appear here when created or assigned.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id} className={task.priority === 'urgent' ? 'border-red-200 bg-red-50/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline">Room {task.room}</Badge>
                        </div>
                        
                        <h3 className="font-medium mb-1">{task.description}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Assigned: {getStaffName(task.assignedTo)}</span>
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {task.estimatedTime} min
                          </span>
                          {task.startedAt && (
                            <span>Started: {task.startedAt.toLocaleTimeString()}</span>
                          )}
                        </div>

                        {task.status === 'in-progress' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{Math.round(getTaskProgress(task))}%</span>
                            </div>
                            <Progress value={getTaskProgress(task)} className="h-2" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {task.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            Assign Staff
                          </Button>
                        )}
                        {task.status === 'in-progress' && (
                          <Button size="sm">
                            Mark Complete
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="space-y-6">
            {Object.entries(
              tasks.reduce((acc, task) => {
                const staffId = task.assignedTo || 'unassigned';
                if (!acc[staffId]) acc[staffId] = [];
                acc[staffId].push(task);
                return acc;
              }, {} as Record<string, Task[]>)
            ).map(([staffId, staffTasks]) => (
              <Card key={staffId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {staffId === 'unassigned' ? 'Unassigned Tasks' : getStaffName(staffId)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staffTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(task.priority)} variant="outline">
                              {task.priority}
                            </Badge>
                            <span className="font-medium">Room {task.room}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{task.description}</div>
                        </div>
                        <Badge className={getTaskStatusColor(task.status)}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
