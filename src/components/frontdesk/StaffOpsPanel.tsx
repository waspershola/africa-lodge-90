import { useState } from "react";
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
  Timer
} from "lucide-react";
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

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'housekeeping',
    status: 'on-duty',
    currentTask: 'Deep cleaning',
    currentRoom: '305',
    completedTasks: 8,
    shiftStart: '07:00'
  },
  {
    id: '2',
    name: 'Mike Chen',
    role: 'maintenance',
    status: 'on-duty',
    currentTask: 'AC repair',
    currentRoom: '201',
    completedTasks: 3,
    shiftStart: '08:00'
  },
  {
    id: '3',
    name: 'Amara Okafor',
    role: 'housekeeping',
    status: 'break',
    completedTasks: 6,
    shiftStart: '07:00'
  },
  {
    id: '4',
    name: 'David Security',
    role: 'security',
    status: 'on-duty',
    currentTask: 'Patrol round',
    completedTasks: 12,
    shiftStart: '06:00'
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    type: 'cleaning',
    room: '405',
    description: 'Standard cleaning after checkout',
    assignedTo: '1',
    status: 'pending',
    priority: 'medium',
    estimatedTime: 45
  },
  {
    id: '2',
    type: 'maintenance',
    room: '302',
    description: 'Bathroom sink leaking',
    assignedTo: '2',
    status: 'in-progress',
    priority: 'high',
    estimatedTime: 60,
    startedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    id: '3',
    type: 'guest-request',
    room: '150',
    description: 'Extra towels and pillows',
    assignedTo: '1',
    status: 'completed',
    priority: 'low',
    estimatedTime: 15,
    completedAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
  },
  {
    id: '4',
    type: 'maintenance',
    room: '210',
    description: 'TV remote not working',
    assignedTo: '',
    status: 'pending',
    priority: 'low',
    estimatedTime: 20
  }
];

export const StaffOpsPanel = () => {
  const { user, tenant } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch actual staff data
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      return data.map(u => ({
        id: u.id,
        name: u.name || 'Unknown',
        role: u.role?.toLowerCase().replace('_', '-') as StaffMember['role'] || 'front-desk',
        status: 'on-duty' as const,
        completedTasks: 0,
        shiftStart: '08:00',
        currentTask: undefined,
        currentRoom: undefined
      }));
    },
    enabled: !!tenant?.tenant_id
  });

  // Fetch housekeeping tasks as staff tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['housekeeping-tasks', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return data.map(task => ({
        id: task.id,
        type: task.task_type as Task['type'] || 'cleaning',
        room: task.room_id ? `Room ${task.room_id}` : 'General',
        description: task.description || task.title,
        assignedTo: task.assigned_to || '',
        status: task.status as Task['status'],
        priority: task.priority as Task['priority'] || 'medium',
        estimatedTime: task.estimated_minutes || 30,
        startedAt: task.started_at ? new Date(task.started_at) : undefined,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined
      }));
    },
    enabled: !!tenant?.tenant_id
  });

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
              {tasks.filter(t => t.status === 'completed').length}
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
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Since {member.shiftStart}
                          </span>
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
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
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