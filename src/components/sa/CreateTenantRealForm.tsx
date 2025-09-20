import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateTenantAndOwner, usePlansReal } from '@/hooks/useTenantsReal';
import { CreateTenantAndOwnerData } from '@/services/tenantService';

const createTenantSchema = z.object({
  hotel_name: z.string().min(1, 'Hotel name is required').max(100, 'Name too long'),
  hotel_slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  plan_id: z.string().min(1, 'Please select a plan'),
  owner_email: z.string().email('Please enter a valid email address'),
  owner_name: z.string().min(1, 'Owner name is required').max(100, 'Name too long'),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

interface CreateTenantRealFormProps {
  onSuccess: () => void;
}

export function CreateTenantRealForm({ onSuccess }: CreateTenantRealFormProps) {
  const createTenant = useCreateTenantAndOwner();
  const { data: plans = [], isLoading: plansLoading } = usePlansReal();

  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      hotel_name: '',
      hotel_slug: '',
      plan_id: '',
      owner_email: '',
      owner_name: '',
      city: 'Lagos',
      address: '',
      phone: '',
    },
  });

  const onSubmit = async (data: CreateTenantForm) => {
    try {
      // Ensure all required fields are present
      const createData: CreateTenantAndOwnerData = {
        hotel_name: data.hotel_name,
        hotel_slug: data.hotel_slug,
        owner_email: data.owner_email,
        owner_name: data.owner_name,
        plan_id: data.plan_id,
        city: data.city,
        address: data.address,
        phone: data.phone,
      };
      await createTenant.mutateAsync(createData);
      onSuccess();
      form.reset();
    } catch (error) {
      // Error handled by the hook
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue('hotel_name', value);
    if (!form.formState.dirtyFields.hotel_slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);
      form.setValue('hotel_slug', slug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hotel_name"
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
            name="hotel_slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug</FormLabel>
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
            name="owner_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="owner_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="owner@hotel.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plan_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Plan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {plansLoading ? (
                      <SelectItem value="loading" disabled>Loading plans...</SelectItem>
                    ) : (
                      plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ₦{plan.price_monthly?.toLocaleString()}/month
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
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
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+234 800 000 0000" {...field} />
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
            {createTenant.isPending ? 'Creating...' : 'Create Tenant & Owner'}
          </Button>
        </div>

        {createTenant.isPending && (
          <div className="text-sm text-muted-foreground">
            Creating tenant, owner account, and sending temporary password email...
          </div>
        )}
      </form>
    </Form>
  );
}