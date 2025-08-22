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

// Templates
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

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
      mockApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'templates'] });
      toast({
        title: 'Success',
        description: 'Template updated successfully',
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

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'templates'] });
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
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

// Roles
export const useRoles = () => {
  return useQuery({
    queryKey: ['sa', 'roles'],
    queryFn: mockApi.getRoles,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'roles'] });
      toast({
        title: 'Success',
        description: 'Role created successfully',
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

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
      mockApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'roles'] });
      toast({
        title: 'Success',
        description: 'Role updated successfully',
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

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'roles'] });
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
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

// Global Users
export const useGlobalUsers = () => {
  return useQuery({
    queryKey: ['sa', 'global-users'],
    queryFn: mockApi.getGlobalUsers,
  });
};

export const useCreateGlobalUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createGlobalUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'global-users'] });
      toast({
        title: 'Success',
        description: 'User created successfully',
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

export const useUpdateGlobalUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
      mockApi.updateGlobalUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'global-users'] });
      toast({
        title: 'Success',
        description: 'User updated successfully',
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

export const useDeleteGlobalUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.deleteGlobalUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'global-users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
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

// Support
export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['sa', 'support'],
    queryFn: mockApi.getSupportTickets,
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'support'] });
      toast({
        title: 'Success',
        description: 'Support ticket created successfully',
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

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
      mockApi.updateSupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'support'] });
      toast({
        title: 'Success',
        description: 'Support ticket updated successfully',
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

// Emergency Mode
export const useEmergencyMode = () => {
  return useQuery({
    queryKey: ['sa', 'emergency'],
    queryFn: mockApi.getEmergencyMode,
  });
};

export const useToggleEmergencyMode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.toggleEmergencyMode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'emergency'] });
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['sa', 'dashboard'] });
      toast({
        title: data.data.enabled ? 'Emergency Mode Activated' : 'Emergency Mode Deactivated',
        description: data.data.enabled ? 'Emergency protocols are now active' : 'Normal operations restored',
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

// Tenant Management
export const useCreateTenantUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createTenantUser,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tenant user created successfully',
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

export const useImpersonateTenant = () => {
  return useMutation({
    mutationFn: mockApi.impersonateTenant,
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