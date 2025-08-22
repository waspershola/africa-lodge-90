import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/api/mockAdapter';
import { useToast } from '@/hooks/use-toast';

// Super Admin hooks
export const useTenants = () => {
  return useQuery({
    queryKey: ['sa', 'tenants'],
    queryFn: mockApi.getTenants,
  });
};

export const useTenant = (id: string) => {
  return useQuery({
    queryKey: ['sa', 'tenants', id],
    queryFn: () => mockApi.getTenant(id),
    enabled: !!id,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: 'Tenant created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      mockApi.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: 'Tenant updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: 'Tenant deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const usePlans = () => {
  return useQuery({
    queryKey: ['sa', 'plans'],
    queryFn: mockApi.getPlans,
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      mockApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'plans'] });
      toast({
        title: 'Success',
        description: 'Plan updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAuditLogs = (page = 1) => {
  return useQuery({
    queryKey: ['sa', 'audit', page],
    queryFn: () => mockApi.getAuditLogs(page),
  });
};

export const useMetrics = () => {
  return useQuery({
    queryKey: ['sa', 'metrics'],
    queryFn: mockApi.getMetrics,
  });
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['sa', 'dashboard'],
    queryFn: mockApi.getDashboardData,
  });
};

export const useTemplates = () => {
  return useQuery({
    queryKey: ['sa', 'templates'],
    queryFn: mockApi.getTemplates,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'templates'] });
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useBroadcasts = () => {
  return useQuery({
    queryKey: ['sa', 'broadcasts'],
    queryFn: mockApi.getBroadcasts,
  });
};

export const useSendBroadcast = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.sendBroadcast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'broadcasts'] });
      toast({
        title: 'Success',
        description: 'Broadcast sent successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['sa', 'support'],
    queryFn: mockApi.getSupportTickets,
  });
};

export const useToggleEmergencyMode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ enabled, reason }: { enabled: boolean; reason?: string }) => 
      mockApi.toggleEmergencyMode(enabled, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'policies'] });
      queryClient.invalidateQueries({ queryKey: ['sa', 'dashboard'] });
      toast({
        title: data.data.enabled ? 'Emergency Mode Activated' : 'Emergency Mode Deactivated',
        description: data.data.enabled ? 'All hotels are now offline' : 'Normal operations restored',
        variant: data.data.enabled ? 'destructive' : 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const usePolicies = () => {
  return useQuery({
    queryKey: ['sa', 'policies'],
    queryFn: mockApi.getPolicies,
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tenantId, offlineWindowHours }: { tenantId: string; offlineWindowHours: number }) => 
      mockApi.updatePolicy(tenantId, offlineWindowHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'policies'] });
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: 'Policy updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};