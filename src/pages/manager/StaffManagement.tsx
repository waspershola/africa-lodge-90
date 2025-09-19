import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Award,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StaffManagement = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const staffMembers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Front Desk Supervisor',
      department: 'front-desk',
      status: 'active',
      shift: 'Morning (6AM - 2PM)',
      currentTasks: 3,
      completedToday: 8,
      rating: 4.8,
      skills: ['Customer Service', 'Check-in/out', 'Problem Resolution'],
      contact: { phone: '(555) 123-4567', email: 'sarah.j@hotel.com' },
      performance: { taskCompletion: 95, guestSatisfaction: 4.9, punctuality: 98 }
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Housekeeping Lead',
      department: 'housekeeping',
      status: 'active',
      shift: 'Morning (7AM - 3PM)',
      currentTasks: 7,
      completedToday: 12,
      rating: 4.6,
      skills: ['Team Leadership', 'Quality Control', 'Training'],
      contact: { phone: '(555) 234-5678', email: 'mike.c@hotel.com' },
      performance: { taskCompletion: 92, guestSatisfaction: 4.7, punctuality: 96 }
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Maintenance Technician',
      department: 'maintenance',
      status: 'on-break',
      shift: 'Day (8AM - 4PM)',
      currentTasks: 2,
      completedToday: 5,
      rating: 4.9,
      skills: ['HVAC', 'Plumbing', 'Electrical', 'Emergency Repair'],
      contact: { phone: '(555) 345-6789', email: 'emily.r@hotel.com' },
      performance: { taskCompletion: 98, guestSatisfaction: 4.8, punctuality: 100 }
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Restaurant Server',
      department: 'restaurant',
      status: 'active',
      shift: 'Evening (2PM - 10PM)',
      currentTasks: 4,
      completedToday: 6,
      rating: 4.4,
      skills: ['Food Service', 'Wine Knowledge', 'Customer Relations'],
      contact: { phone: '(555) 456-7890', email: 'david.k@hotel.com' },
      performance: { taskCompletion: 89, guestSatisfaction: 4.5, punctuality: 94 }
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      role: 'Security Officer',
      department: 'security',
      status: 'active',
      shift: 'Night (10PM - 6AM)',
      currentTasks: 1,
      completedToday: 3,
      rating: 4.7,
      skills: ['Security Protocols', 'Emergency Response', 'Surveillance'],
      contact: { phone: '(555) 567-8901', email: 'lisa.t@hotel.com' },
      performance: { taskCompletion: 97, guestSatisfaction: 4.6, punctuality: 99 }
    }
  ];

  const departmentStats = {
    'front-desk': { total: 4, active: 3, onBreak: 1 },
    'housekeeping': { total: 12, active: 10, onBreak: 2 },
    'maintenance': { total: 3, active: 2, onBreak: 1 },
    'restaurant': { total: 8, active: 6, onBreak: 2 },
    'security': { total: 4, active: 3, onBreak: 1 }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'on-break': return 'secondary';
      case 'offline': return 'destructive';
      default: return 'default';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'front-desk': return 'default';
      case 'housekeeping': return 'secondary';
      case 'maintenance': return 'destructive';
      case 'restaurant': return 'default';
      case 'security': return 'outline';
      default: return 'default';
    }
  };

  const filteredStaff = selectedDepartment === 'all' 
    ? staffMembers 
    : staffMembers.filter(staff => staff.department === selectedDepartment);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Performance & Management</h1>
          <p className="text-muted-foreground">Monitor staff activities, performance, and task assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Schedules
          </Button>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Department Filter */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>Filter and manage staff by department</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="front-desk">Front Desk</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staff Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStaff.map((staff, index) => (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`} />
                          <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{staff.name}</h3>
                          <p className="text-sm text-muted-foreground">{staff.role}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getDepartmentColor(staff.department)}>
                              {staff.department.replace('-', ' ')}
                            </Badge>
                            <Badge variant={getStatusColor(staff.status)}>
                              {staff.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{staff.rating}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Shift & Tasks */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Current Shift</div>
                          <div className="text-sm text-muted-foreground">{staff.shift}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Tasks Today</div>
                          <div className="text-sm text-muted-foreground">
                            {staff.currentTasks} active, {staff.completedToday} completed
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <div className="text-sm font-medium mb-2">Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {staff.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {staff.contact.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {staff.contact.email}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Assign Task
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Schedule
                        </Button>
                        <Button size="sm" variant="outline">
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance Metrics</CardTitle>
                <CardDescription>Individual performance tracking and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredStaff.map((staff, index) => (
                    <div key={staff.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`} />
                            <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{staff.name}</h4>
                            <p className="text-sm text-muted-foreground">{staff.role}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(staff.status)}>
                          Overall Rating: {staff.rating}/5
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Task Completion</span>
                            <span>{staff.performance.taskCompletion}%</span>
                          </div>
                          <Progress value={staff.performance.taskCompletion} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Guest Satisfaction</span>
                            <span>{staff.performance.guestSatisfaction}/5</span>
                          </div>
                          <Progress value={staff.performance.guestSatisfaction * 20} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Punctuality</span>
                            <span>{staff.performance.punctuality}%</span>
                          </div>
                          <Progress value={staff.performance.punctuality} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Task Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Task Assignment & Tracking</CardTitle>
                <CardDescription>Monitor and assign tasks to staff members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Task Management Interface</h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced task assignment and tracking features will be available here.
                  </p>
                  <Button>
                    Create New Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance Tracking */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Staff Attendance</CardTitle>
                <CardDescription>Monitor staff attendance and shift compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Attendance System</h3>
                  <p className="text-muted-foreground mb-4">
                    Real-time attendance tracking and shift management will be available here.
                  </p>
                  <Button>
                    View Time Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffManagement;