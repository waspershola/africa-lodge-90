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
import { UserPlus, Copy, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { callEdgeFunction } from "@/lib/api-utils";
import { toast } from 'sonner';
import { useGlobalRoles } from '@/hooks/useRoles';

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
    availableRoles?: string[];
    existing_user?: {
      id: string;
      email: string;
      can_reset_password: boolean;
    };
    user?: {
      id: string;
      email: string;
      name?: string | null;
      phone?: string | null;
      role: string;
    };
  } | null>(null);

  const { data: globalRoles, isLoading: loadingGlobalRoles } = useGlobalRoles();

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
    try {
      setIsSubmitting(true);

      const result = await callEdgeFunction({
        functionName: 'create-global-user-fixed',
        body: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          role: data.role,
        },
        showErrorToast: false // We'll handle errors manually
      });

      if (result.success && result.data) {
        setCreateResult(result.data);
        form.reset();
        
        toast.success('Global user created successfully!');

        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle structured error responses
        const errorMessage = result.error || 'Failed to create global user';
        
        if (result.data?.code === 'USER_EXISTS') {
          setCreateResult({
            success: false,
            error: errorMessage,
            code: result.data.code,
            existing_user: result.data.existing_user
          });
          return; // Don't show toast, let user decide
        } else if (result.data?.code === 'INVALID_ROLE') {
          setCreateResult({
            success: false,
            error: errorMessage,
            code: result.data.code,
            availableRoles: result.data.availableRoles
          });
          toast.error('Invalid role selected. Please choose from the available roles.');
        } else {
          toast.error(errorMessage);
          setCreateResult({
            success: false,
            error: errorMessage,
            code: result.data?.code
          });
        }
      }

    } catch (error: any) {
      console.error('Failed to create global user:', error);
      toast.error(error.message || 'Failed to create global user - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Temporary password copied to clipboard');
  };

  const handleClose = () => {
    setIsOpen(false);
    setCreateResult(null);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
          <Shield className="h-4 w-4 mr-2" />
          Create Global User
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Create Global User
          </DialogTitle>
        </DialogHeader>

        {createResult ? (
          <div className="space-y-4">
            {createResult.success ? (
              // Success - show temporary password
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium text-green-800">
                      Global user created successfully!
                    </p>
                    
                    <div className="bg-white border rounded p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        User Details:
                      </p>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {createResult.user?.name || 'Not provided'}</p>
                        <p><span className="font-medium">Email:</span> {createResult.user?.email}</p>
                        <p><span className="font-medium">Phone:</span> {createResult.user?.phone || 'Not provided'}</p>
                        <p><span className="font-medium">Role:</span> {createResult.user?.role}</p>
                      </div>
                    </div>

                    {createResult.tempPassword && (
                      <div className="bg-white border rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Temporary Password:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono bg-gray-100 px-2 py-1 rounded flex-1 select-all">
                            {createResult.tempPassword}
                          </code>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(createResult.tempPassword!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-800 font-medium">
                            🔐 User must reset password on first login
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Please share this password securely with the user.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : createResult.existing_user ? (
              // User already exists
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium text-yellow-800">User already exists</p>
                    <p className="text-sm">{createResult.existing_user.email}</p>
                    <p className="text-xs text-yellow-700">
                      A user with this email address already exists in the system.
                      Please use a different email address.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : createResult.availableRoles ? (
              // Invalid role - show available roles
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium text-red-800">Invalid Role</p>
                    <p className="text-sm">Available global roles:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {createResult.availableRoles.map((role) => (
                        <li key={role} className="text-red-700">{role}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              // Generic error
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{createResult.error}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
              {!createResult.success && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCreateResult(null);
                    form.reset();
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
              )}
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
                  <Input type="email" placeholder="admin@company.com" {...field} />
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
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
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
                <FormLabel>Address (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, City, Country" {...field} />
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
                <FormLabel>Global Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select global role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingGlobalRoles ? (
                      <SelectItem value="" disabled>Loading roles...</SelectItem>
                    ) : (
                      globalRoles?.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-2">Temporary Password Setup</p>
              <ul className="text-xs space-y-1">
                <li>• A secure temporary password will be auto-generated</li>
                <li>• User must reset password on first login (expires in 7 days)</li>
                <li>• User will have platform-wide access based on their role</li>
                <li>• Temporary password will be shown after creation</li>
              </ul>
            </AlertDescription>
          </Alert>

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