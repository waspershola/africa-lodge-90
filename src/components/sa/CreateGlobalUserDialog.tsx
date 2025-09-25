import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateGlobalUser } from '@/hooks/useGlobalUsers';

const createGlobalUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_STAFF']),
  department: z.string().optional(),
});

type CreateGlobalUserForm = z.infer<typeof createGlobalUserSchema>;

export function CreateGlobalUserDialog() {
  const [open, setOpen] = useState(false);
  const createUser = useCreateGlobalUser();

  const form = useForm<CreateGlobalUserForm>({
    resolver: zodResolver(createGlobalUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'SUPPORT_STAFF',
      department: '',
    },
  });

  const onSubmit = async (data: CreateGlobalUserForm) => {
    try {
      await createUser.mutateAsync({
        email: data.email,
        name: data.name,
        role: data.role,
        department: data.department || undefined
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
      console.error('Form submission error:', error);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Global User</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter full name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="Enter email address"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.watch('role')}
              onValueChange={(value) => form.setValue('role', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                <SelectItem value="SUPPORT_STAFF">Support Staff</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
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
      </DialogContent>
    </Dialog>
  );
}