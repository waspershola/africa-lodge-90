import { useState } from 'react';
import { Plus, RotateCcw, User } from 'lucide-react';
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
import { useCreateGlobalUser, useGenerateTempPassword } from '@/hooks/useGlobalUsers';
import { toast } from '@/hooks/use-toast';

const createGlobalUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_STAFF']),
  department: z.string().optional(),
  generateTempPassword: z.boolean().default(false),
  sendCredentials: z.boolean().default(true),
});

type CreateGlobalUserForm = z.infer<typeof createGlobalUserSchema>;

export function CreateGlobalUserDialogNew() {
  const [open, setOpen] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const createUser = useCreateGlobalUser();
  const generateTempPassword = useGenerateTempPassword();

  const form = useForm<CreateGlobalUserForm>({
    resolver: zodResolver(createGlobalUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'SUPPORT_STAFF',
      department: '',
      generateTempPassword: false,
      sendCredentials: true,
    },
  });

  const watchGenerateTemp = form.watch('generateTempPassword');

  const onSubmit = async (data: CreateGlobalUserForm) => {
    try {
      const result = await createUser.mutateAsync({
        fullName: data.name,
        email: data.email, 
        role: data.role,
        department: data.department || undefined,
        generateTempPassword: data.generateTempPassword,
        sendEmail: data.sendCredentials
      });

      // Show temporary password if generated
      if (result?.user?.tempPassword) {
        toast({
          title: "User Created Successfully",
          description: `Temporary password: ${result.user.tempPassword}`,
          duration: 15000,
        });
      }

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
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
                    A temporary password will be generated and displayed. The user will be required to change it on first login.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                form.reset();
                setCreatedUserId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createUser.isPending || generateTempPassword.isPending}
            >
              {createUser.isPending ? 'Creating...' : 
               generateTempPassword.isPending ? 'Generating Password...' : 
               'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}