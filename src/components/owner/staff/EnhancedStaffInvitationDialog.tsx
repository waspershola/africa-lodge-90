import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  UserPlus,
  Mail,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
  Users,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useStaffInvites } from '@/hooks/useStaffInvites';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface EnhancedStaffInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface InviteStaffForm {
  email: string;
  name: string;
  role: string;
  department: string;
  send_email: boolean;
  personalMessage?: string;
}

const staffRoles = [
  { 
    id: 'MANAGER', 
    label: 'Manager', 
    description: 'Full operational access, can manage all departments',
    permissions: ['Manage Staff', 'View Reports', 'Handle Billing', 'Room Management']
  },
  { 
    id: 'FRONT_DESK', 
    label: 'Front Desk', 
    description: 'Check-in/out, reservations, guest services',
    permissions: ['Reservations', 'Guest Check-in/out', 'Room Status', 'Basic Billing']
  },
  { 
    id: 'HOUSEKEEPING', 
    label: 'Housekeeping', 
    description: 'Room cleaning, maintenance requests, supplies',
    permissions: ['Room Cleaning', 'Supply Management', 'Maintenance Requests', 'Task Management']
  },
  { 
    id: 'MAINTENANCE', 
    label: 'Maintenance', 
    description: 'Technical repairs, facility upkeep, equipment',
    permissions: ['Work Orders', 'Equipment Management', 'Preventive Maintenance', 'Supplies']
  },
  { 
    id: 'POS', 
    label: 'Restaurant/Bar', 
    description: 'Food & beverage operations, menu management',
    permissions: ['Order Management', 'Menu Control', 'Payment Processing', 'Kitchen Display']
  },
  { 
    id: 'ACCOUNTANT', 
    label: 'Accountant', 
    description: 'Financial management, billing, reports',
    permissions: ['Financial Reports', 'Billing Management', 'Payment Tracking', 'Audit Logs']
  }
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

export function EnhancedStaffInvitationDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: EnhancedStaffInvitationDialogProps) {
  const { tenant } = useAuth();
  const { inviteUser, isLoading } = useStaffInvites();
  
  const [currentStep, setCurrentStep] = useState<'form' | 'result'>('form');
  const [inviteForm, setInviteForm] = useState<InviteStaffForm>({
    email: '',
    name: '',
    role: '',
    department: '',
    send_email: true,
    personalMessage: ''
  });
  
  const [inviteResult, setInviteResult] = useState<{
    success: boolean;
    temp_password?: string;
    email_sent?: boolean;
    user_id?: string;
    error?: string;
    email_error?: string;
  } | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);

  const selectedRole = staffRoles.find(r => r.id === inviteForm.role);

  const handleFormChange = (field: keyof InviteStaffForm, value: string | boolean) => {
    setInviteForm(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${description} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleInviteSubmit = async () => {
    if (!inviteForm.email || !inviteForm.name || !inviteForm.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await inviteUser({
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        department: inviteForm.department || undefined,
        send_email: inviteForm.send_email,
        tenant_id: tenant?.tenant_id
      });

      setInviteResult(result);
      setCurrentStep('result');
      
      if (result.success) {
        onSuccess?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    }
  };

  const handleClose = () => {
    setCurrentStep('form');
    setInviteForm({
      email: '',
      name: '',
      role: '',
      department: '',
      send_email: true,
      personalMessage: ''
    });
    setInviteResult(null);
    onOpenChange(false);
  };

  const isFormValid = inviteForm.email && inviteForm.name && inviteForm.role;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep === 'form' ? (
              <>
                <UserPlus className="h-5 w-5" />
                Invite New Staff Member
              </>
            ) : (
              <>
                {inviteResult?.success ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-danger" />
                )}
                Invitation {inviteResult?.success ? 'Sent' : 'Failed'}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'form' 
              ? `Add a new team member to ${tenant?.hotel_name}`
              : inviteResult?.success 
                ? 'Staff member has been successfully invited'
                : 'There was an issue sending the invitation'
            }
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'form' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name *</Label>
                <Input
                  id="staff-name"
                  placeholder="Enter full name"
                  value={inviteForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email Address *</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteForm.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role *</Label>
                <Select value={inviteForm.role} onValueChange={(value) => handleFormChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="staff-department">Department</Label>
                <Select value={inviteForm.department} onValueChange={(value) => handleFormChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedRole && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {selectedRole.label} Permissions
                  </CardTitle>
                  <CardDescription>
                    {selectedRole.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedRole.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-email"
                  checked={inviteForm.send_email}
                  onCheckedChange={(checked) => handleFormChange('send_email', !!checked)}
                />
                <Label htmlFor="send-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send invitation email
                </Label>
              </div>
              
              {!inviteForm.send_email && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    If you don't send an email, you'll need to manually share the temporary password with the staff member.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="personal-message">Personal Message (Optional)</Label>
              <Textarea
                id="personal-message"
                placeholder="Add a personal welcome message..."
                value={inviteForm.personalMessage}
                onChange={(e) => handleFormChange('personalMessage', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleInviteSubmit} 
                disabled={!isFormValid || isLoading}
                className="bg-gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {inviteResult?.success ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Staff member has been successfully invited to {tenant?.hotel_name}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {inviteForm.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {inviteForm.email}
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> {selectedRole?.label}
                    </div>
                    <div>
                      <span className="font-medium">Department:</span> {inviteForm.department || 'Not specified'}
                    </div>
                  </div>

                  <Separator />

                  {inviteResult.email_sent ? (
                    <Alert>
                      <Mail className="h-4 w-4" />
                      <AlertDescription>
                        An invitation email has been sent to {inviteForm.email} with login instructions and temporary password.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {inviteResult.email_error 
                            ? `Email delivery failed: ${inviteResult.email_error}` 
                            : 'Email was not sent as requested'
                          }
                        </AlertDescription>
                      </Alert>

                      {inviteResult.temp_password && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Temporary Password
                            </CardTitle>
                            <CardDescription>
                              Share this password with {inviteForm.name}. They will be required to change it on first login.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                              <code className="flex-1 font-mono text-sm">
                                {showPassword ? inviteResult.temp_password : '••••••••••••••••'}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(inviteResult.temp_password!, 'Temporary password')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Password expires in 24 hours
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {inviteResult?.error || 'Failed to send invitation. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              {inviteResult?.success ? (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setCurrentStep('form');
                    setInviteForm({
                      email: '',
                      name: '',
                      role: '',
                      department: '',
                      send_email: true,
                      personalMessage: ''
                    });
                    setInviteResult(null);
                  }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Another
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={() => setCurrentStep('form')}>
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}