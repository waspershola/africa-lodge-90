import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePricingPlans, PricingPlan } from '@/hooks/usePricingPlans';
import { useCreateTenantAndOwner } from '@/hooks/useTenants';
import { CreateTenantAndOwnerData } from '@/services/tenantService';
import { toast } from 'sonner';

const createTenantSchema = z.object({
  hotel_name: z.string().min(1, 'Hotel name is required').max(100, 'Name too long'),
  hotel_slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
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
  const createTenantAndOwner = useCreateTenantAndOwner();
  const { plans, loading: plansLoading } = usePricingPlans();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<{ tenant: any; tempPassword: string } | null>(null);

  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      hotel_name: '',
      hotel_slug: '',
      owner_email: '',
      owner_name: '',
      city: 'Lagos',
      address: '',
      phone: '',
    },
  });

  const onSubmit = async (data: CreateTenantForm) => {
    try {
      setIsSubmitting(true);
      
      // Get default starter plan
      const defaultPlan = plans.find(p => p.name.toLowerCase().includes('starter')) || plans[0];
      
      console.log('Available plans:', plans);
      console.log('Selected default plan:', defaultPlan);
      
      if (!defaultPlan) {
        throw new Error('No default plan available');
      }

      console.log('Using plan:', defaultPlan.id, defaultPlan.name);

      // Ensure all required fields are present
      const createData: CreateTenantAndOwnerData = {
        hotel_name: data.hotel_name,
        hotel_slug: data.hotel_slug,
        owner_email: data.owner_email,
        owner_name: data.owner_name,
        plan_id: defaultPlan.id,
        city: data.city,
        address: data.address || '',
        phone: data.phone || '',
      };
      
      console.log('Final create data:', createData);
      const result = await createTenantAndOwner.mutateAsync(createData);
      console.log('Create result:', result);
      
      setCreatedTenant(result);
      setShowPassword(true);
      form.reset();
    } catch (error: any) {
      console.error('Failed to create tenant:', error);
      toast.error(error.message || 'Failed to create tenant');
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-6">
      {showPassword && createdTenant && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Tenant Created Successfully!
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-green-700">
              <strong>Hotel:</strong> {createdTenant.tenant.hotel_name}
            </p>
            <p className="text-sm text-green-700">
              <strong>Owner Email:</strong> {createdTenant.tenant.email}
            </p>
            <div className="bg-white border rounded p-3">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Temporary Password:
              </p>
              <code className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                {createdTenant.tempPassword}
              </code>
              <p className="text-xs text-gray-500 mt-1">
                Please provide this password to the hotel owner. They will be prompted to change it on first login.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowPassword(false);
              setCreatedTenant(null);
              onSuccess();
            }}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Close
          </button>
        </div>
      )}

      {!showPassword && (
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
            
            {plansLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading plans to assign default starter plan...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <strong>Note:</strong> A default starter plan will be automatically assigned. The owner can upgrade during onboarding.
              </div>
            )}

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
                disabled={createTenantAndOwner.isPending || isSubmitting}
                className="bg-gradient-primary shadow-luxury hover:shadow-hover"
              >
                {(createTenantAndOwner.isPending || isSubmitting) ? 'Creating...' : 'Create Tenant & Owner'}
              </Button>
            </div>

            {(createTenantAndOwner.isPending || isSubmitting) && (
              <div className="text-sm text-muted-foreground">
                Creating tenant, owner account, and sending temporary password email...
              </div>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}