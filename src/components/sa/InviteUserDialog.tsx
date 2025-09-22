import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Mail, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { callEdgeFunction } from "@/lib/api-utils";
import { toast } from 'sonner';
import { useGlobalRoles, useTenantRoles } from '@/hooks/useRoles';

const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.string().min(1, 'Please select a role'),
  department: z.string().optional(),
  setTempPassword: z.boolean().optional(),
  resetExisting: z.boolean().optional(),
});

type InviteUserForm = z.infer<typeof inviteUserSchema>;

interface InviteUserDialogProps {
  tenantId?: string;
  onSuccess?: () => void;
}

export function InviteUserDialog({ tenantId, onSuccess }: InviteUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    success: boolean;
    email_sent?: boolean;
    temp_password?: string;
    message?: string;
    error?: string;
    debug_info?: any;
    code?: string;
    existing_user?: {
      id: string;
      email: string;
      can_reset_password: boolean;
    };
  } | null>(null);

  // Fetch appropriate roles based on context
  const { data: globalRoles, isLoading: loadingGlobalRoles } = useGlobalRoles();
  const { data: tenantRoles, isLoading: loadingTenantRoles } = useTenantRoles(tenantId || '');

  const form = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: '',
      department: '',
      setTempPassword: false,
      resetExisting: false,
    },
  });

  const onSubmit = async (data: InviteUserForm) => {
    try {
      setIsSubmitting(true);

        const result = await callEdgeFunction({
          functionName: 'invite-user',
          body: {
            email: data.email,
            name: data.name,
            role: data.role,
            tenant_id: tenantId || null,
            department: data.department || null,
            set_temp_password: data.setTempPassword || false,
            reset_existing: data.resetExisting || false
          },
          showErrorToast: false // We'll handle errors manually for better UX
        });

      if (result.success && result.data) {
        setInviteResult(result.data);
        form.reset();
        
        if (result.data.email_sent) {
          toast.success('User invited successfully! Invitation email sent.');
        } else {
          toast.warning('User created but email failed. Please share the temporary password manually.');
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle structured error responses with better UX
        const errorMessage = result.error || 'Failed to invite user';
        const errorDetails = result.data?.details || '';
        const fullErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        
        if (result.data?.code === 'USER_EXISTS' && result.data?.existing_user?.can_reset_password) {
          // Show the existing user info with reset option
          setInviteResult({
            success: false,
            error: errorMessage,
            code: result.data.code,
            existing_user: result.data.existing_user
          });
          return; // Don't show toast, let user decide
        } else if (errorMessage.includes('already exists')) {
          toast.error('A user with this email already exists in the system');
        } else if (errorMessage.includes('role not found') || errorMessage.includes('not found')) {
          toast.error('The specified role was not found. Please check the role name and try again.');
        } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
          toast.error('Failed to create user authentication account. Please try again or contact support.');
        } else {
          toast.error(fullErrorMessage);
        }
        
        // Set detailed error info for debugging
        setInviteResult({
          success: false,
          error: fullErrorMessage,
          debug_info: result.data?.debug_info,
          code: result.data?.code
        });
      }

    } catch (error: any) {
      console.error('Failed to invite user:', error);
      toast.error(error.message || 'Failed to invite user - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleClose = () => {
    setIsOpen(false);
    setInviteResult(null);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>

        {inviteResult ? (
          <div className="space-y-4">
            {inviteResult.existing_user ? (
              // Existing user - show reset options
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium">User already exists:</p>
                    <p className="text-sm">{inviteResult.existing_user.email}</p>
                    
                    {inviteResult.existing_user.can_reset_password && (
                      <div className="flex gap-3 pt-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            // Reset with temporary password
                            form.setValue('resetExisting', true);
                            form.setValue('setTempPassword', true);
                            setInviteResult(null);
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Reset Password
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setInviteResult(null)}
                        >
                          Try Different Email
                        </Button>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              // Success or error result
              <Alert className={inviteResult.success && inviteResult.email_sent ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                <CheckCircle className={`h-4 w-4 ${inviteResult.success && inviteResult.email_sent ? "text-green-600" : "text-yellow-600"}`} />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{inviteResult.message}</p>
                    
                    {!inviteResult.email_sent && inviteResult.temp_password && (
                      <div className="bg-white border rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Temporary Password:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono bg-gray-100 px-2 py-1 rounded flex-1">
                            {inviteResult.temp_password}
                          </code>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(inviteResult.temp_password!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Please share this password with the user. They will be prompted to change it on first login.
                        </p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setInviteResult(null);
                  form.reset();
                }}
                className="flex-1"
              >
                Invite Another
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@hotel.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenantId ? (
                          // Tenant-specific roles from database
                          <>
                            {loadingTenantRoles ? (
                              <SelectItem value="" disabled>Loading roles...</SelectItem>
                            ) : (
                              tenantRoles?.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))
                            )}
                          </>
                        ) : (
                          // Global roles from database
                          <>
                            {loadingGlobalRoles ? (
                              <SelectItem value="" disabled>Loading roles...</SelectItem>
                            ) : (
                              globalRoles?.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Front Office, Housekeeping, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Global user options */}
              {!tenantId && (
                <div className="space-y-4 pt-2 border-t">
                  <FormField
                    control={form.control}
                    name="setTempPassword"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            Set temporary password
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            User will be forced to change password on first login
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('resetExisting') && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        This will reset the existing user's password and force them to change it on next login.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-primary shadow-luxury hover:shadow-hover"
                >
                  {isSubmitting ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}