import { useState } from 'react';
import { Plus, RotateCcw, User, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateGlobalUser } from '@/hooks/useGlobalUsers';
import { toast } from '@/hooks/use-toast';

const createGlobalUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_STAFF']),
  department: z.string().optional(),
  generateTempPassword: z.boolean().default(true),
  sendCredentials: z.boolean().default(true),
});

type CreateGlobalUserForm = z.infer<typeof createGlobalUserSchema>;

export function CreateGlobalUserDialog() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const createUser = useCreateGlobalUser();

  const form = useForm<CreateGlobalUserForm>({
    resolver: zodResolver(createGlobalUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'SUPPORT_STAFF',
      department: '',
      generateTempPassword: true,
      sendCredentials: true,
    },
  });

  const watchGenerateTemp = form.watch('generateTempPassword');

  const copyToClipboard = async (text: string, label: string = 'Password') => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${label} Copied`,
        description: `${label} has been copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: CreateGlobalUserForm) => {
    try {
      const result = await createUser.mutateAsync({
        fullName: data.name,
        email: data.email,
        role: data.role,
        department: data.department || undefined,
        generateTempPassword: data.generateTempPassword,
        sendEmail: data.sendCredentials,
      });

      // Store generated password to display
      if (result?.user?.tempPassword) {
        setGeneratedPassword(result.user.tempPassword);
        toast({
          title: "User Created Successfully",
          description: `${data.name} has been created. Temporary password generated.`,
          duration: 10000,
        });
      } else {
        toast({
          title: "User Created Successfully",
          description: `${data.name} has been created successfully.`,
        });
        // Close dialog if no password to show
        setTimeout(() => {
          setOpen(false);
          form.reset();
          setGeneratedPassword(null);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    form.reset();
    setGeneratedPassword(null);
    setShowPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Global User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create Global User
          </DialogTitle>
        </DialogHeader>

        {generatedPassword ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">User Created Successfully!</h3>
              <p className="text-sm text-green-700 mb-4">
                {form.getValues('name')} has been created with the role {form.getValues('role')}.
              </p>
              
              <div className="bg-white border border-green-200 rounded p-3">
                <Label className="text-sm font-medium text-gray-700">Temporary Password</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={generatedPassword}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedPassword, 'Temporary password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-green-600 mt-2">
                ⚠️ Please save this password securely. The user will need to change it on first login.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Enter full name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="Enter email address"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Global Role</Label>
                <Select
                  value={form.watch('role')}
                  onValueChange={(value) => form.setValue('role', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select global role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPORT_STAFF">Support Staff</SelectItem>
                    <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  {...form.register('department')}
                  placeholder="Enter department (optional)"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Password & Access Options</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="generateTempPassword"
                    checked={form.watch('generateTempPassword')}
                    onCheckedChange={(checked) => form.setValue('generateTempPassword', !!checked)}
                  />
                  <Label htmlFor="generateTempPassword" className="flex items-center gap-2 cursor-pointer">
                    <RotateCcw className="h-4 w-4" />
                    Generate temporary password (user must reset on first login)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sendCredentials"
                    checked={form.watch('sendCredentials')}
                    onCheckedChange={(checked) => form.setValue('sendCredentials', !!checked)}
                  />
                  <Label htmlFor="sendCredentials" className="cursor-pointer">
                    Send login credentials via email
                  </Label>
                </div>

                {watchGenerateTemp && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      A secure temporary password will be generated and displayed after creation. The user will be required to change it on first login.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUser.isPending}
              >
                {createUser.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}