import { useState } from 'react';
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
import { 
  UserPlus, 
  Users, 
  Mail, 
  Shield, 
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  RotateCcw
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
}

const staffRoles = [
  { id: 'MANAGER', label: 'Manager', description: 'Full operational access' },
  { id: 'FRONT_DESK', label: 'Front Desk', description: 'Check-in/out, reservations' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping', description: 'Room cleaning, maintenance' },
  { id: 'MAINTENANCE', label: 'Maintenance', description: 'Technical repairs, upkeep' },
  { id: 'POS', label: 'POS/Kitchen', description: 'Restaurant, food service' },
  { id: 'STAFF', label: 'General Staff', description: 'Limited access' }
];

export function StaffInvitationInterface() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: '1',
      email: 'manager@hotel.com',
      name: 'John Manager',
      role: 'MANAGER',
      status: 'active',
      invitedAt: '2025-09-01',
      lastLogin: '2025-09-18'
    },
    {
      id: '2',
      email: 'frontdesk@hotel.com',
      name: 'Sarah Desk',
      role: 'FRONT_DESK',
      status: 'active',
      invitedAt: '2025-09-02',
      lastLogin: '2025-09-19'
    },
    {
      id: '3',
      email: 'newstaff@hotel.com',
      name: 'Mike New',
      role: 'HOUSEKEEPING',
      status: 'invited',
      invitedAt: '2025-09-18'
    }
  ]);

  const [inviteForm, setInviteForm] = useState<InviteStaffForm>({
    email: '',
    name: '',
    role: ''
  });
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const handleInviteStaff = async () => {
    if (!inviteForm.email || !inviteForm.name || !inviteForm.role) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newStaff: StaffMember = {
        id: Date.now().toString(),
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        status: 'invited',
        invitedAt: new Date().toISOString().split('T')[0]
      };
      
      setStaffMembers(prev => [...prev, newStaff]);
      setInviteForm({ email: '', name: '', role: '' });
      setInviteDialogOpen(false);
      
      toast({
        title: "Invitation sent",
        description: `Invited ${inviteForm.name} as ${staffRoles.find(r => r.id === inviteForm.role)?.label}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStaffMembers(prev => prev.filter(s => s.id !== staffId));
      
      toast({
        title: "Staff removed",
        description: "Staff member has been removed from your hotel"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (staffId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Invitation resent",
        description: "Invitation email has been sent again"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
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
            Staff Members ({staffMembers.length})
          </CardTitle>
          <CardDescription>
            Manage your hotel's staff members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffMembers.length > 0 ? (
            <div className="space-y-3">
              {staffMembers.map((staff) => (
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