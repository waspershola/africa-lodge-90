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
import { UserPlus, Mail, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.string().min(1, 'Please select a role'),
  department: z.string().optional(),
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
    email_sent: boolean;
    temp_password?: string;
    message: string;
  } | null>(null);

  const form = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: '',
      department: '',
    },
  });

  const onSubmit = async (data: InviteUserForm) => {
    try {
      setIsSubmitting(true);

      const { data: result, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: data.email,
          name: data.name,
          role: data.role,
          tenant_id: tenantId || null,
          department: data.department || null
        }
      });

      if (error) throw error;

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to invite user');
      }

      setInviteResult(result);
      form.reset();
      
      if (result.email_sent) {
        toast.success('Invitation sent successfully!');
      } else {
        toast.warning('User created but email failed. Please share the temporary password manually.');
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Failed to invite user:', error);
      toast.error(error.message || 'Failed to invite user');
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
            <Alert className={inviteResult.email_sent ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              <CheckCircle className={`h-4 w-4 ${inviteResult.email_sent ? "text-green-600" : "text-yellow-600"}`} />
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
                          // Tenant-specific roles
                          <>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="FRONT_DESK">Front Desk</SelectItem>
                            <SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
                            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                            <SelectItem value="POS">POS Staff</SelectItem>
                            <SelectItem value="STAFF">General Staff</SelectItem>
                          </>
                        ) : (
                          // Global roles (Super Admin context)
                          <>
                            <SelectItem value="OWNER">Hotel Owner</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
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