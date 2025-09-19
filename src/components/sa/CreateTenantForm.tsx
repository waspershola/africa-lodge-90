import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateTenant } from '@/hooks/useApi';

const createTenantSchema = z.object({
  name: z.string().min(1, 'Hotel name is required').max(100, 'Name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  plan: z.enum(['Starter', 'Growth', 'Pro'], {
    required_error: 'Please select a plan',
  }),
  contactEmail: z.string().email('Please enter a valid email address'),
  totalRooms: z.number().min(1, 'Must have at least 1 room').max(999, 'Too many rooms'),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  offlineWindowHours: z.number().min(12, 'Minimum 12 hours').max(48, 'Maximum 48 hours'),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

interface CreateTenantFormProps {
  onSuccess: () => void;
}

export function CreateTenantForm({ onSuccess }: CreateTenantFormProps) {
  const createTenant = useCreateTenant();

  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      plan: 'Growth',
      contactEmail: '',
      totalRooms: 25,
      city: '',
      offlineWindowHours: 24,
    },
  });

  const onSubmit = async (data: CreateTenantForm) => {
    try {
      await createTenant.mutateAsync({
        hotel_name: data.name,
        hotel_slug: data.slug,
        email: data.contactEmail,
        city: data.city,
        subscription_status: 'active',
        plan_id: '00000000-0000-0000-0000-000000000001',
        address: '',
        brand_colors: {},
        country: 'Nigeria',
        currency: 'NGN',
        logo_url: '',
        onboarding_step: 'hotel_information',
        phone: '',
        receipt_template: 'default',
        settings: {},
        setup_completed: false,
        timezone: 'Africa/Lagos',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      onSuccess();
      form.reset();
    } catch (error) {
      // Error handled by the hook
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    if (!form.formState.dirtyFields.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);
      form.setValue('slug', slug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotel Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Grand Palace Hotel"
                    {...field}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createTenant.isPending}
            className="bg-gradient-primary shadow-luxury hover:shadow-hover"
          >
            {createTenant.isPending ? 'Creating...' : 'Create Tenant'}
          </Button>
        </div>
      </form>
    </Form>
  );
}