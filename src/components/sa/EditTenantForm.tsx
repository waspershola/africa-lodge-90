import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUpdateTenant } from '@/hooks/useApi';
import type { Tenant } from '@/lib/supabase-api';

const editTenantSchema = z.object({
  name: z.string().min(1, 'Hotel name is required').max(100, 'Name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  plan: z.enum(['Starter', 'Growth', 'Pro'], {
    required_error: 'Please select a plan',
  }),
  status: z.enum(['active', 'inactive'], {
    required_error: 'Please select a status',
  }),
  contactEmail: z.string().email('Please enter a valid email address'),
  totalRooms: z.number().min(1, 'Must have at least 1 room').max(999, 'Too many rooms'),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  offlineWindowHours: z.number().min(12, 'Minimum 12 hours').max(48, 'Maximum 48 hours'),
});

type EditTenantForm = z.infer<typeof editTenantSchema>;

interface EditTenantFormProps {
  tenant: Tenant;
  onSuccess: () => void;
}

export function EditTenantForm({ tenant, onSuccess }: EditTenantFormProps) {
  const updateTenant = useUpdateTenant();

  const form = useForm<EditTenantForm>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      name: tenant.hotel_name,
      slug: tenant.hotel_slug,
      plan: 'Growth' as 'Starter' | 'Growth' | 'Pro', // Will be derived from plan_id
      status: tenant.subscription_status === 'active' ? 'active' : 'inactive',
      contactEmail: tenant.email || '',
      totalRooms: 50, // Default value as this is not stored in tenants table
      city: tenant.city || '',
      offlineWindowHours: 24, // Default value
    },
  });

  const onSubmit = async (data: EditTenantForm) => {
    try {
      await updateTenant.mutateAsync({
        id: tenant.tenant_id,
        updates: {
          hotel_name: data.name,
          hotel_slug: data.slug,
          email: data.contactEmail,
          city: data.city,
          subscription_status: data.status === 'active' ? 'active' : 'trialing',
        },
      });
      onSuccess();
    } catch (error) {
      // Error handled by the hook
    }
  };

  return (
    <div className="mt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Name</FormLabel>
                <FormControl>
                  <Input placeholder="Grand Palace Hotel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="grand-palace-hotel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="admin@hotel.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Lagos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalRooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Rooms</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="25"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offlineWindowHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offline Window (hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="24"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTenant.isPending}
              className="bg-gradient-primary shadow-luxury hover:shadow-hover"
            >
              {updateTenant.isPending ? 'Updating...' : 'Update Tenant'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}