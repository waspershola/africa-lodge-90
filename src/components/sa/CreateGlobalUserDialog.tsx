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
import { UserPlus, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const createGlobalUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.string().min(1, 'Please select a role'),
});

type CreateGlobalUserForm = z.infer<typeof createGlobalUserSchema>;

interface CreateGlobalUserDialogProps {
  onSuccess?: () => void;
}

export function CreateGlobalUserDialog({ onSuccess }: CreateGlobalUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createResult, setCreateResult] = useState<{
    success: boolean;
    tempPassword?: string;
    message?: string;
    error?: string;
    code?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  } | null>(null);

  const form = useForm<CreateGlobalUserForm>({
    resolver: zodResolver(createGlobalUserSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      address: '',
      role: '',
    },
  });

  const onSubmit = async (data: CreateGlobalUserForm) => {
    setIsSubmitting(true);
    setCreateResult(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('create-global-user', {
        body: data
      });

      if (error) {
        throw new Error(error.message || 'Failed to create user');
      }

      if (!result.success) {
        setCreateResult({
          success: false,
          error: result.error,
          code: result.code
        });
        return;
      }

      setCreateResult({
        success: true,
        message: result.message,
        tempPassword: result.tempPassword,
        user: result.user
      });

      toast.success('Global user created successfully');
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Error creating global user:', error);
      setCreateResult({
        success: false,
        error: error.message || 'Failed to create user'
      });
      toast.error(error.message || 'Failed to create user');
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
    setCreateResult(null);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Global User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Global User</DialogTitle>
        </DialogHeader>

        {createResult ? (
          <div className="space-y-4">
            {createResult.success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    User created successfully! Please save the temporary password.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">User Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {createResult.user?.name}</p>
                      <p><strong>Email:</strong> {createResult.user?.email}</p>
                      <p><strong>Role:</strong> {createResult.user?.role}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Temporary Password</h4>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-blue-100 rounded text-blue-900 font-mono">
                        {createResult.tempPassword}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(createResult.tempPassword!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      User must change this password on first login.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleClose} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {createResult.code === 'USER_EXISTS' ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A user with this email address already exists.
                    </AlertDescription>
                  </Alert>
                ) : createResult.code === 'INVALID_ROLE' ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      The specified role is not valid. Please select a valid role.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {createResult.error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    Close
                  </Button>
                  <Button 
                    onClick={() => setCreateResult(null)} 
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
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
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
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
                    <FormLabel>Global Role *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                        <SelectItem value="Support Staff">Support Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}