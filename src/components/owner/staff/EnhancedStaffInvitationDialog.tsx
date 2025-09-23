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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Loader2,
  CalendarIcon,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  User,
  Briefcase,
  UserX,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  
  // Personal Details
  phone?: string;
  address?: string;
  nin?: string;
  date_of_birth?: Date;
  nationality?: string;
  
  // Employment Details
  employee_id?: string;
  hire_date?: Date;
  employment_type?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Next of Kin
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  
  // Banking Details
  bank_name?: string;
  account_number?: string;
  
  // Additional Documents
  passport_number?: string;
  drivers_license?: string;
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

const employmentTypes = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
  'Temporary'
];

const relationshipTypes = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Guardian',
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
    personalMessage: '',
    employment_type: 'Full-time'
  });
  
  const [inviteResult, setInviteResult] = useState<{
    success: boolean;
    temp_password?: string;
    email_sent?: boolean;
    user_id?: string;
    error?: string;
    email_error?: string;
    show_temp_password?: boolean;
  } | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);

  const selectedRole = staffRoles.find(r => r.id === inviteForm.role);

  const handleFormChange = (field: keyof InviteStaffForm, value: string | boolean | Date | undefined) => {
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
      console.log('Submitting invitation for:', inviteForm.email);
      
      const result = await inviteUser({
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        department: inviteForm.department || undefined,
        send_email: inviteForm.send_email,
        tenant_id: tenant?.tenant_id,
        
        // Additional profile data
        phone: inviteForm.phone,
        address: inviteForm.address,
        nin: inviteForm.nin,
        date_of_birth: inviteForm.date_of_birth ? inviteForm.date_of_birth.toISOString().split('T')[0] : undefined,
        nationality: inviteForm.nationality,
        employee_id: inviteForm.employee_id,
        hire_date: inviteForm.hire_date ? inviteForm.hire_date.toISOString().split('T')[0] : undefined,
        employment_type: inviteForm.employment_type,
        emergency_contact_name: inviteForm.emergency_contact_name,
        emergency_contact_phone: inviteForm.emergency_contact_phone,
        emergency_contact_relationship: inviteForm.emergency_contact_relationship,
        next_of_kin_name: inviteForm.next_of_kin_name,
        next_of_kin_phone: inviteForm.next_of_kin_phone,
        next_of_kin_relationship: inviteForm.next_of_kin_relationship,
        bank_name: inviteForm.bank_name,
        account_number: inviteForm.account_number,
        passport_number: inviteForm.passport_number,
        drivers_license: inviteForm.drivers_license
      });

      console.log('Invitation result:', result);
      
      setInviteResult(result);
      setCurrentStep('result');
      
      if (result.success) {
        // Show success toast
        if (result.email_sent) {
          toast.success(
            `✅ Invitation sent to ${result.email}! They will receive login instructions via email.`
          );
        } else {
          toast.success(
            `✅ User created successfully! ${result.temp_password ? 'Temporary password generated.' : ''}`
          );
        }
        
        // Show warning if email failed
        if (result.email_error) {
          toast.warning(
            `⚠️ Email delivery failed: ${result.email_error}. Please share the temporary password manually.`
          );
        }
        
        onSuccess?.();
      } else {
        // Show specific error messages based on error type
        let errorMessage = result.error || 'Failed to send invitation';
        
        if (result.error?.includes('already registered in another tenant')) {
          errorMessage = 'Email Already Used in Another Tenant';
          toast.error(
            `❌ ${errorMessage}\n\nThis email is already registered under another tenant. Please remove the user from their current tenant first, or use a different email address.`,
            { duration: 8000 }
          );
        } else if (result.error?.includes('already exists in this tenant')) {
          errorMessage = 'User Already Exists';
          toast.error(
            `❌ ${errorMessage}\n\nA user with this email already exists in your tenant. Please check your staff directory or use a different email.`,
            { duration: 6000 }
          );
        } else if (result.error?.includes('Network connection failed')) {
          errorMessage = 'Network Connection Failed';
          toast.error(
            `❌ ${errorMessage}\n\nUnable to reach the invitation service. Please check your internet connection and try again.`,
            { duration: 6000 }
          );
        } else if (result.error?.includes('Email already registered')) {
          errorMessage = 'Email Already Registered';
          toast.error(
            `❌ ${errorMessage}\n\nThis email is already registered in the system. Please use a different email or contact support.`,
            { duration: 6000 }
          );
        } else {
          toast.error(`❌ ${errorMessage}`);
        }
        
        // Show additional info if temp password is available
        if (result.temp_password) {
          toast.info('💡 Temporary password generated for manual sharing.', { duration: 4000 });
        }
      }
    } catch (error) {
      console.error('Invitation error:', error);
      
      // Set error result for display
      setInviteResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send invitation'
      });
      setCurrentStep('result');
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
      personalMessage: '',
      employment_type: 'Full-time'
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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment
                </TabsTrigger>
                <TabsTrigger value="emergency" className="flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
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
                    <Label htmlFor="staff-phone">Phone Number</Label>
                    <Input
                      id="staff-phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={inviteForm.phone || ''}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="staff-nin">NIN (National ID)</Label>
                    <Input
                      id="staff-nin"
                      placeholder="Enter NIN (optional)"
                      value={inviteForm.nin || ''}
                      onChange={(e) => handleFormChange('nin', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !inviteForm.date_of_birth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {inviteForm.date_of_birth ? (
                            format(inviteForm.date_of_birth, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={inviteForm.date_of_birth}
                          onSelect={(date) => handleFormChange('date_of_birth', date)}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="staff-nationality">Nationality</Label>
                    <Input
                      id="staff-nationality"
                      placeholder="Enter nationality"
                      value={inviteForm.nationality || ''}
                      onChange={(e) => handleFormChange('nationality', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-address">Address</Label>
                  <Textarea
                    id="staff-address"
                    placeholder="Enter full address"
                    value={inviteForm.address || ''}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4 mt-6">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee-id">Employee ID</Label>
                    <Input
                      id="employee-id"
                      placeholder="Enter employee ID"
                      value={inviteForm.employee_id || ''}
                      onChange={(e) => handleFormChange('employee_id', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employment-type">Employment Type</Label>
                    <Select value={inviteForm.employment_type} onValueChange={(value) => handleFormChange('employment_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !inviteForm.hire_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {inviteForm.hire_date ? (
                          format(inviteForm.hire_date, "PPP")
                        ) : (
                          <span>Select hire date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={inviteForm.hire_date}
                        onSelect={(date) => handleFormChange('hire_date', date)}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
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
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Emergency Contact
                    </CardTitle>
                    <CardDescription>
                      Person to contact in case of emergency
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency-name">Name</Label>
                        <Input
                          id="emergency-name"
                          placeholder="Enter contact name"
                          value={inviteForm.emergency_contact_name || ''}
                          onChange={(e) => handleFormChange('emergency_contact_name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="emergency-phone">Phone</Label>
                        <Input
                          id="emergency-phone"
                          type="tel"
                          placeholder="Enter contact phone"
                          value={inviteForm.emergency_contact_phone || ''}
                          onChange={(e) => handleFormChange('emergency_contact_phone', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency-relationship">Relationship</Label>
                      <Select value={inviteForm.emergency_contact_relationship} onValueChange={(value) => handleFormChange('emergency_contact_relationship', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipTypes.map((rel) => (
                            <SelectItem key={rel} value={rel.toLowerCase()}>
                              {rel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Next of Kin
                    </CardTitle>
                    <CardDescription>
                      Legal next of kin for official purposes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="kin-name">Name</Label>
                        <Input
                          id="kin-name"
                          placeholder="Enter next of kin name"
                          value={inviteForm.next_of_kin_name || ''}
                          onChange={(e) => handleFormChange('next_of_kin_name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="kin-phone">Phone</Label>
                        <Input
                          id="kin-phone"
                          type="tel"
                          placeholder="Enter next of kin phone"
                          value={inviteForm.next_of_kin_phone || ''}
                          onChange={(e) => handleFormChange('next_of_kin_phone', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kin-relationship">Relationship</Label>
                      <Select value={inviteForm.next_of_kin_relationship} onValueChange={(value) => handleFormChange('next_of_kin_relationship', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipTypes.map((rel) => (
                            <SelectItem key={rel} value={rel.toLowerCase()}>
                              {rel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Banking Information
                    </CardTitle>
                    <CardDescription>
                      For salary payments (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank-name">Bank Name</Label>
                        <Input
                          id="bank-name"
                          placeholder="Enter bank name"
                          value={inviteForm.bank_name || ''}
                          onChange={(e) => handleFormChange('bank_name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                          id="account-number"
                          placeholder="Enter account number"
                          value={inviteForm.account_number || ''}
                          onChange={(e) => handleFormChange('account_number', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Identity Documents
                    </CardTitle>
                    <CardDescription>
                      Additional identification (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passport-number">Passport Number</Label>
                        <Input
                          id="passport-number"
                          placeholder="Enter passport number"
                          value={inviteForm.passport_number || ''}
                          onChange={(e) => handleFormChange('passport_number', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="drivers-license">Driver's License</Label>
                        <Input
                          id="drivers-license"
                          placeholder="Enter license number"
                          value={inviteForm.drivers_license || ''}
                          onChange={(e) => handleFormChange('drivers_license', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Separator />

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
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                     {inviteResult?.error?.includes('already registered in another tenant') ? (
                       <div className="space-y-2">
                         <div className="font-medium">Email Already Used in Another Tenant</div>
                         <div>This email address is already registered under a different tenant. Please remove the user from their current tenant first, or use a different email address.</div>
                       </div>
                     ) : inviteResult?.error?.includes('already exists in this tenant') ? (
                       <div className="space-y-2">
                         <div className="font-medium">User Already Exists</div>
                         <div>A user with this email already exists in your tenant. Please check your staff directory or use a different email address.</div>
                       </div>
                     ) : inviteResult?.error?.includes('Network connection failed') ? (
                       <div className="space-y-2">
                         <div className="font-medium">Network Connection Failed</div>
                         <div>Unable to reach the invitation service. Please check your internet connection and try again.</div>
                       </div>
                     ) : inviteResult?.error?.includes('Email already registered') ? (
                       <div className="space-y-2">
                         <div className="font-medium">Email Already Registered</div>
                         <div>This email is already registered in the system. Please use a different email or contact support.</div>
                       </div>
                     ) : (
                       inviteResult?.error || 'Failed to send invitation. Please try again.'
                     )}
                  </AlertDescription>
                </Alert>

                {/* Show temp password even if invitation failed */}
                {inviteResult?.temp_password && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Temporary Password (Manual Setup Required)
                      </CardTitle>
                      <CardDescription>
                        The invitation failed, but you can manually set up the user with this temporary password.
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
              </>
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
                      personalMessage: '',
                      employment_type: 'Full-time'
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