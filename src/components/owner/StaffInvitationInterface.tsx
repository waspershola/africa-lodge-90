import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  UserPlus, 
  Users, 
  Mail, 
  Shield, 
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  RotateCcw,
  Copy,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { TemporaryPasswordResetDialog } from '@/components/auth/TemporaryPasswordResetDialog';
import { supabase } from '@/integrations/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import { useStaffInvites } from '@/hooks/useStaffInvites';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  invitedAt: string;
  lastLogin?: string;
}

interface InviteStaffForm {
  email: string;
  name: string;
  role: string;
  department: string;
  send_email: boolean;
}

const staffRoles = [
  { id: 'OWNER', label: 'Owner', description: 'Full control over the hotel' },
  { id: 'MANAGER', label: 'Manager', description: 'Full operational access' },
  { id: 'FRONT_DESK', label: 'Front Desk', description: 'Check-in/out, reservations' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping', description: 'Room cleaning, maintenance' },
  { id: 'MAINTENANCE', label: 'Maintenance', description: 'Technical repairs, upkeep' },
  { id: 'POS', label: 'Restaurant/Bar', description: 'Food & beverage operations' },
  { id: 'ACCOUNTING', label: 'Accountant', description: 'Billing, payments, financial reports' }
];

const departments = [
  'Front Office',
  'Housekeeping', 
  'Food & Beverage',
  'Maintenance',
  'Accounting',
  'Administration',
  'Security',
  'Other'
];

export function StaffInvitationInterface() {
  const { tenant, user } = useAuth();
  const { toast } = useToast();
  const { users: staffMembers, loading: usersLoading, createUser, deactivateUser } = useUsers();
  const { inviteUser, isLoading: inviteLoading } = useStaffInvites();
  const [staffMembersDisplay, setStaffMembersDisplay] = useState<StaffMember[]>([]);

  const [inviteForm, setInviteForm] = useState<InviteStaffForm>({
    email: '',
    name: '',
    role: '',
    department: '',
    send_email: true
  });
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    success: boolean;
    temp_password?: string;
    email_sent?: boolean;
    error?: string;
  } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const handleInviteStaff = async () => {
    if (!inviteForm.email || !inviteForm.name || !inviteForm.role) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await inviteUser({
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        department: inviteForm.department || undefined,
        send_email: inviteForm.send_email,
        tenant_id: tenant?.tenant_id
      });

      if (result.success) {
        setInviteResult({
          success: true,
          temp_password: result.temp_password,
          email_sent: result.email_sent,
          error: result.email_error
        });
        setShowResultDialog(true);
        
        // Reset form
        setInviteForm({ 
          email: '', 
          name: '', 
          role: '', 
          department: '', 
          send_email: true 
        });
        setInviteDialogOpen(false);
        
        toast({
          title: "Invitation sent",
          description: `Invited ${inviteForm.name} as ${staffRoles.find(r => r.id === inviteForm.role)?.label}`
        });
      } else {
        setInviteResult({
          success: false,
          error: result.error || 'Failed to send invitation'
        });
        setShowResultDialog(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    setLoading(true);
    try {
      await deactivateUser(staffId);
      
      toast({
        title: "Staff removed",
        description: "Staff member has been removed from your hotel"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform Supabase users to display format
  useEffect(() => {
    const transformedStaff: StaffMember[] = staffMembers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'Unknown',
      role: user.role,
      status: user.is_active ? 'active' : 'suspended',
      invitedAt: user.created_at?.split('T')[0] || '',
      lastLogin: user.last_login?.split('T')[0]
    }));
    setStaffMembersDisplay(transformedStaff);
  }, [staffMembers]);

  const handleResendInvite = async (staffId: string) => {
    setLoading(true);
    try {
      // Send password reset email
      const staff = staffMembers.find(s => s.id === staffId);
      if (staff) {
        const { error } = await supabase.auth.resetPasswordForEmail(staff.email);
        if (error) throw error;
      }
      
      toast({
        title: "Invitation resent",
        description: "Password reset email has been sent"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'invited': return 'bg-warning/10 text-warning border-warning/20';
      case 'suspended': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-primary/10 text-primary border-primary/20';
      case 'FRONT_DESK': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'HOUSEKEEPING': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'MAINTENANCE': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'POS': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">
            Invite and manage staff members for {tenant?.hotel_name}
          </p>
        </div>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Staff Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {tenant?.hotel_name} as a staff member
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name</Label>
                <Input
                  id="staff-name"
                  placeholder="Enter staff member's name"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email Address</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  The staff member will receive an email invitation with setup instructions.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setInviteDialogOpen(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleInviteStaff}
                  className="flex-1"
                  disabled={loading || !inviteForm.email || !inviteForm.name || !inviteForm.role}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Members ({staffMembersDisplay.length})
          </CardTitle>
          <CardDescription>
            Manage your hotel's staff members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : staffMembersDisplay.length > 0 ? (
            <div className="space-y-3">
              {staffMembersDisplay.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{staff.name}</p>
                        <Badge className={getStatusColor(staff.status)}>
                          {staff.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{staff.email}</p>
                      {staff.lastLogin && (
                        <p className="text-xs text-muted-foreground">
                          Last login: {new Date(staff.lastLogin).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={getRoleColor(staff.role)}>
                      {staffRoles.find(r => r.id === staff.role)?.label}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        {staff.status === 'invited' && (
                          <DropdownMenuItem onClick={() => handleResendInvite(staff.id)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Invite
                          </DropdownMenuItem>
                        )}
                        {staff.status === 'active' && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedStaff(staff);
                              setResetPasswordOpen(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleRemoveStaff(staff.id)}
                          className="text-danger"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Staff
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No staff members yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by inviting your first staff member to join your hotel
              </p>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Staff Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Temporary Password Reset Dialog */}
      {selectedStaff && (
        <TemporaryPasswordResetDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          userId={selectedStaff.id}
          userEmail={selectedStaff.email}
          userRole={selectedStaff.role}
        />
      )}
    </div>
  );
}