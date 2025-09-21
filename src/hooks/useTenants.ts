import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tenantService, CreateTenantAndOwnerData, TenantWithOwner } from '@/services/tenantService';
import { supabase } from '@/integrations/supabase/client';

export const useTenantsReal = () => {
  return useQuery({
    queryKey: ['tenants-real'],
    queryFn: tenantService.getAllTenants,
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
};

export const useTenantMetrics = () => {
  return useQuery({
    queryKey: ['tenant-metrics'],
    queryFn: tenantService.getTenantMetrics,
    retry: 2,
    staleTime: 60000, // 1 minute
  });
};

export const useCreateTenantAndOwner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTenantAndOwnerData) => {
      console.log('Attempting to create tenant with data:', data);
      
      // Call secure edge function directly instead of going through tenantService
      const { data: result, error } = await supabase.functions.invoke('create-tenant-and-owner', {
        body: data
      });

      console.log('Edge function response:', { result, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to create tenant and owner: ${error.message}`);
      }

      if (!result?.success) {
        console.error('Edge function returned error:', result);
        throw new Error(result?.error || 'Unknown error occurred');
      }

      return { 
        tenant: result.tenant, 
        tempPassword: result.tempPassword || result.temp_password // Handle both field names
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-real'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] });
      toast.success('Tenant and owner created successfully! Temporary password sent via email.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tenant and owner');
    },
  });
};

export const useUpdateTenantReal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantId, updates }: { tenantId: string; updates: any }) =>
      tenantService.updateTenant(tenantId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-real'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] });
      toast.success('Tenant updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update tenant');
    },
  });
};

export const useSuspendTenantReal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tenantId: string) => tenantService.suspendTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-real'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] });
      toast.success('Tenant suspended successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend tenant');
    },
  });
};

export const useReactivateTenantReal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tenantId: string) => tenantService.reactivateTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-real'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] });
      toast.success('Tenant reactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reactivate tenant');
    },
  });
};

export const useDeleteTenantReal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tenantId: string) => tenantService.deleteTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants-real'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] });
      toast.success('Tenant deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tenant');
    },
  });
};

export const usePlansReal = () => {
  return useQuery({
    queryKey: ['plans-real'],
    queryFn: tenantService.getPlans,
    retry: 2,
    staleTime: 300000, // 5 minutes
  });
};