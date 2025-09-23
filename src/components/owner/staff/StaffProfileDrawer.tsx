import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  CreditCard, 
  FileText, 
  Shield, 
  Heart, 
  UserX 
} from 'lucide-react';
import { format } from 'date-fns';
import { StaffInvitationStatusBadge } from './StaffInvitationStatusBadge';

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

interface StaffProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
}

const roleLabels: Record<string, string> = {
  'OWNER': 'Owner',
  'MANAGER': 'Manager',
  'FRONT_DESK': 'Front Desk',
  'HOUSEKEEPING': 'Housekeeping',
  'MAINTENANCE': 'Maintenance',
  'POS': 'Restaurant/Bar',
  'ACCOUNTING': 'Accountant',
};

export function StaffProfileDrawer({ open, onOpenChange, staff }: StaffProfileDrawerProps) {
  if (!staff) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const formatEmploymentType = (type?: string) => {
    if (!type) return 'Not specified';
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {staff.name}
          </SheetTitle>
          <SheetDescription>
            View detailed staff member information and contact details
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="font-medium">{staff.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{staff.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="font-medium">{staff.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                  <p className="font-medium">{staff.nationality || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="font-medium">{formatDate(staff.date_of_birth)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NIN</label>
                  <p className="font-medium">{staff.nin || 'Not provided'}</p>
                </div>
              </div>

              {staff.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="font-medium">{staff.address}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Status:</label>
                <StaffInvitationStatusBadge 
                  status={staff.status}
                  forceReset={staff.force_reset}
                  tempExpires={staff.temp_expires}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      {roleLabels[staff.role] || staff.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="font-medium">{staff.department || 'Not assigned'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                  <p className="font-medium">{staff.employee_id || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
                  <p className="font-medium">{formatEmploymentType(staff.employment_type)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                  <p className="font-medium">{formatDate(staff.hire_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invited On</label>
                  <p className="font-medium">{staff.invitedAt}</p>
                </div>
              </div>

              {staff.lastLogin && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                  <p className="font-medium">{staff.lastLogin}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(staff.emergency_contact_name || staff.emergency_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-medium">{staff.emergency_contact_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="font-medium">{staff.emergency_contact_phone || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                  <p className="font-medium">{staff.emergency_contact_relationship || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next of Kin */}
          {(staff.next_of_kin_name || staff.next_of_kin_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Next of Kin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-medium">{staff.next_of_kin_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="font-medium">{staff.next_of_kin_phone || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                  <p className="font-medium">{staff.next_of_kin_relationship || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banking Information */}
          {(staff.bank_name || staff.account_number) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Banking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                    <p className="font-medium">{staff.bank_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                    <p className="font-medium">{staff.account_number ? '****' + staff.account_number.slice(-4) : 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {(staff.passport_number || staff.drivers_license) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Identity Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Passport Number</label>
                    <p className="font-medium">{staff.passport_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Driver's License</label>
                    <p className="font-medium">{staff.drivers_license || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}