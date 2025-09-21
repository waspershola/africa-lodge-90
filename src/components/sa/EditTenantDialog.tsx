import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUpdateTenantReal } from '@/hooks/useTenants';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import type { TenantWithOwner } from '@/services/tenantService';

const editTenantSchema = z.object({
  hotel_name: z.string().min(1, 'Hotel name is required').max(100, 'Name too long'),
  hotel_slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  plan_id: z.string().min(1, 'Please select a plan'),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email address').optional(),
});

type EditTenantForm = z.infer<typeof editTenantSchema>;

interface EditTenantDialogProps {
  tenant: TenantWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTenantDialog({ tenant, isOpen, onClose }: EditTenantDialogProps) {
  const updateTenant = useUpdateTenantReal();
  const { plans } = usePricingPlans();

  const form = useForm<EditTenantForm>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      hotel_name: tenant?.hotel_name || '',
      hotel_slug: tenant?.hotel_slug || '',
      plan_id: tenant?.plan_id || '',
      city: tenant?.city || '',
      phone: tenant?.phone || '',
      email: tenant?.email || '',
    },
  });

  // Update form when tenant changes
  React.useEffect(() => {
    if (tenant) {
      form.reset({
        hotel_name: tenant.hotel_name,
        hotel_slug: tenant.hotel_slug,
        plan_id: tenant.plan_id,
        city: tenant.city || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: EditTenantForm) => {
    if (!tenant) return;
    
    try {
      await updateTenant.mutateAsync({
        tenantId: tenant.tenant_id,
        updates: {
          hotel_name: data.hotel_name,
          hotel_slug: data.hotel_slug,
          plan_id: data.plan_id,
          city: data.city,
          phone: data.phone,
          email: data.email,
        },
      });
      onClose();
    } catch (error) {
      // Error handled by the hook
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Tenant Details</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="hotel_name"
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
              name="hotel_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hotel Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="grand-palace-hotel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan_id"
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
                      {plans
                        .filter(plan => plan.status === 'active')
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ₦{plan.price?.toLocaleString()}/month ({plan.room_capacity_min}-{plan.room_capacity_max === 9999 ? '∞' : plan.room_capacity_max} rooms)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 123 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="info@hotel.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateTenant.isPending}
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
      </DialogContent>
    </Dialog>
  );
}