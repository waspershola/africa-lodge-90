import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Users, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  RotateCcw,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Download,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useUsers } from '@/hooks/useUsers';
import { useStaffInvites } from '@/hooks/useStaffInvites';
import { EnhancedStaffInvitationDialog } from './EnhancedStaffInvitationDialog';
import { TemporaryPasswordResetDialog } from '@/components/auth/TemporaryPasswordResetDialog';
import { StaffProfileDrawer } from './StaffProfileDrawer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StaffInvitationStatusBadge } from './StaffInvitationStatusBadge';
import { StaffExportDialog } from './StaffExportDialog';
import { StaffTemplateDialog } from './StaffTemplateDialog';
import { StaffBulkImportDialog } from './StaffBulkImportDialog';
import { SalaryManagementTab } from './SalaryManagementTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  status: 'active' | 'invited' | 'suspended';
  invitedAt: string;
  lastLogin?: string;
  force_reset?: boolean;
  temp_expires?: string;
  
  // Additional profile fields
  phone?: string;
  address?: string;
  nin?: string;
  date_of_birth?: string;
  nationality?: string;
  employee_id?: string;
  hire_date?: string;
  employment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  bank_name?: string;
  account_number?: string;
  passport_number?: string;
  drivers_license?: string;
}

const staffRoles = [
  { id: 'OWNER', label: 'Owner', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'MANAGER', label: 'Manager', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'FRONT_DESK', label: 'Front Desk', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { id: 'MAINTENANCE', label: 'Maintenance', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { id: 'POS', label: 'Restaurant/Bar', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { id: 'ACCOUNTANT', label: 'Accountant', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
];

export function StaffManagementDashboard() {
  const { tenant, user } = useAuth();
  const { users: staffMembers, loading: usersLoading, deactivateUser } = useUsers();
  const { resetUserPassword } = useStaffInvites();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffMembersDisplay, setStaffMembersDisplay] = useState<StaffMember[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);

  // Transform Supabase users to display format
  useEffect(() => {
    const transformedStaff: StaffMember[] = staffMembers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'Unknown',
      role: user.role,
      department: user.department,
      status: user.is_active ? 'active' : 'suspended',
      invitedAt: user.created_at?.split('T')[0] || '',
      lastLogin: user.last_login?.split('T')[0],
      force_reset: user.force_reset,
      temp_expires: user.temp_expires
    }));
    setStaffMembersDisplay(transformedStaff);
  }, [staffMembers]);

  const filteredStaff = staffMembersDisplay.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStaff = staffMembersDisplay.filter(s => s.status === 'active').length;
  const pendingInvites = staffMembersDisplay.filter(s => s.force_reset && s.temp_expires).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'invited': return 'bg-warning/10 text-warning border-warning/20';
      case 'suspended': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getRoleInfo = (role: string) => {
    return staffRoles.find(r => r.id === role) || { id: role, label: role, color: 'bg-muted text-muted-foreground border-muted' };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName} from your team?`)) {
      return;
    }

    try {
      await deactivateUser(staffId);
      toast.success(`${staffName} has been removed from your team`);
      // Force re-render by reloading users
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove staff member');
    }
  };

  const handleResendInvite = async (staffId: string, staffEmail: string) => {
    try {
      const result = await resetUserPassword(staffId);
      if (result.success) {
        toast.success(`New temporary password generated for ${staffEmail}`);
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invitation');
    }
  };

  const isPendingReset = (staff: StaffMember) => {
    if (!staff.force_reset || !staff.temp_expires) return false;
    return new Date(staff.temp_expires) > new Date();
  };

  const isExpiredReset = (staff: StaffMember) => {
    if (!staff.force_reset || !staff.temp_expires) return false;
    return new Date(staff.temp_expires) <= new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">
            Manage your team members and their access to {tenant?.hotel_name}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setTemplateDialogOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button 
            variant="outline"
            onClick={() => setBulkImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button 
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            disabled={staffMembersDisplay.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Staff
          </Button>
          <Button 
            onClick={() => setInviteDialogOpen(true)}
            className="bg-gradient-primary"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembersDisplay.length}</div>
            <p className="text-xs text-muted-foreground">
              Including owners and managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeStaff}</div>
            <p className="text-xs text-muted-foreground">
              Currently active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Setup</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingInvites}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting first login
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="salary">Salary Management</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredStaff.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No staff members found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {staffMembersDisplay.length === 0 
                      ? "Start building your team by inviting your first staff member"
                      : "No staff members match your search criteria"
                    }
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)} className="bg-gradient-primary">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Staff Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredStaff.map((staff) => {
            const roleInfo = getRoleInfo(staff.role);
            const pendingReset = isPendingReset(staff);
            const expiredReset = isExpiredReset(staff);
            
            return (
              <Card key={staff.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {getInitials(staff.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{staff.name}</h3>
                          {pendingReset && (
                            <Badge variant="outline" className="text-warning border-warning/20">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Setup
                            </Badge>
                          )}
                          {expiredReset && (
                            <Badge variant="outline" className="text-danger border-danger/20">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{staff.email}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={roleInfo.color}>
                              <Shield className="h-3 w-3 mr-1" />
                              {roleInfo.label}
                            </Badge>
                            {staff.department && (
                              <Badge variant="outline">
                                {staff.department}
                              </Badge>
                            )}
                            <StaffInvitationStatusBadge 
                              status={staff.status}
                              forceReset={staff.force_reset}
                              tempExpires={staff.temp_expires}
                            />
                          </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Joined {staff.invitedAt}</div>
                        {staff.lastLogin && (
                          <div>Last login {staff.lastLogin}</div>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedStaff(staff);
                              setProfileDrawerOpen(true);
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedStaff(staff);
                              setResetPasswordOpen(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResendInvite(staff.id, staff.email)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Regenerate Access
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveStaff(staff.id, staff.name)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="salary">
          <SalaryManagementTab />
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Performance Tracking</h3>
                <p className="text-muted-foreground">
                  Staff performance metrics and evaluation tools coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EnhancedStaffInvitationDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          // Force refresh by reloading the component
          window.location.reload();
        }}
      />

      <StaffExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        staffData={staffMembersDisplay}
      />

      <StaffTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
      />

      <StaffBulkImportDialog
        open={bulkImportDialogOpen}
        onOpenChange={setBulkImportDialogOpen}
        onSuccess={() => {
          // Force refresh by reloading the component
          window.location.reload();
        }}
      />

      {selectedStaff && (
        <TemporaryPasswordResetDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          userId={selectedStaff.id}
          userEmail={selectedStaff.email}
          userRole={selectedStaff.role}
        />
      )}
      <StaffProfileDrawer
        open={profileDrawerOpen}
        onOpenChange={setProfileDrawerOpen}
        staff={selectedStaff}
      />

      <StaffExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        staffData={staffMembersDisplay}
      />
    </div>
  );
}