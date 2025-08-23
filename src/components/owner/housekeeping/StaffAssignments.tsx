import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  UserPlus,
  Settings,
  Phone,
  Mail
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: 'housekeeper' | 'maintenance' | 'supervisor';
  phone: string;
  email: string;
  status: 'active' | 'busy' | 'offline';
  currentTasks: number;
  completedToday: number;
  rating: number;
  shift: 'morning' | 'afternoon' | 'night';
  skills: string[];
}

export default function StaffAssignments() {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterShift, setFilterShift] = useState('all');

  // Mock staff data
  const staffMembers: StaffMember[] = [
    {
      id: 'staff-1',
      name: 'Maria Santos',
      role: 'housekeeper',
      phone: '+234 801 234 5678',
      email: 'maria.santos@hotel.com',
      status: 'active',
      currentTasks: 3,
      completedToday: 8,
      rating: 4.8,
      shift: 'morning',
      skills: ['Room Cleaning', 'Laundry', 'Inventory Management']
    },
    {
      id: 'staff-2',
      name: 'John Doe',
      role: 'maintenance',
      phone: '+234 802 345 6789',
      email: 'john.doe@hotel.com',
      status: 'busy',
      currentTasks: 2,
      completedToday: 4,
      rating: 4.5,
      shift: 'morning',
      skills: ['Plumbing', 'Electrical', 'HVAC', 'General Repairs']
    },
    {
      id: 'staff-3',
      name: 'Sarah Johnson',
      role: 'housekeeper',
      phone: '+234 803 456 7890',
      email: 'sarah.johnson@hotel.com',
      status: 'active',
      currentTasks: 2,
      completedToday: 6,
      rating: 4.7,
      shift: 'afternoon',
      skills: ['Deep Cleaning', 'Quality Control', 'Training']
    },
    {
      id: 'staff-4',
      name: 'Mike Wilson',
      role: 'supervisor',
      phone: '+234 804 567 8901',
      email: 'mike.wilson@hotel.com',
      status: 'active',
      currentTasks: 0,
      completedToday: 12,
      rating: 4.9,
      shift: 'morning',
      skills: ['Team Management', 'Quality Assurance', 'Training', 'Scheduling']
    }
  ];

  const filteredStaff = staffMembers.filter(staff => {
    const matchesRole = filterRole === 'all' || staff.role === filterRole;
    const matchesShift = filterShift === 'all' || staff.shift === filterShift;
    return matchesRole && matchesShift;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'busy': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'offline': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'housekeeper': return 'bg-primary/10 text-primary border-primary/20';
      case 'maintenance': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'supervisor': return 'bg-warning/10 text-warning-foreground border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'busy': return <Clock className="h-4 w-4" />;
      case 'offline': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">Manage housekeeping and maintenance staff assignments</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Filters */}
      <Card className="luxury-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="housekeeper">Housekeeper</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterShift} onValueChange={setFilterShift}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="grid gap-4">
        {filteredStaff.map((staff) => (
          <Card key={staff.id} className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{staff.name}</h3>
                      <Badge className={getStatusColor(staff.status)} variant="outline">
                        {getStatusIcon(staff.status)}
                        {staff.status.toUpperCase()}
                      </Badge>
                      <Badge className={getRoleColor(staff.role)} variant="outline">
                        {staff.role.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">
                        {staff.shift.toUpperCase()} SHIFT
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {staff.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {staff.email}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Tasks: </span>
                        <span className="font-semibold">{staff.currentTasks}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed Today: </span>
                        <span className="font-semibold">{staff.completedToday}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating: </span>
                        <span className="font-semibold">{staff.rating}/5.0</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {staff.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Task
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="luxury-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStaff.filter(s => s.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">
              {filteredStaff.filter(s => s.status === 'busy').length} busy, {filteredStaff.filter(s => s.status === 'offline').length} offline
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.reduce((sum, staff) => sum + staff.currentTasks, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Currently assigned</div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.reduce((sum, staff) => sum + staff.completedToday, 0)}
            </div>
            <div className="text-xs text-muted-foreground">All staff combined</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}