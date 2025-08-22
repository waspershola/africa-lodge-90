import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/api/mockAdapter';
import { useToast } from '@/hooks/use-toast';

// Owner Dashboard hooks - Hotel Profile
export const useHotelProfile = () => {
  return useQuery({
    queryKey: ['owner', 'hotel-profile'],
    queryFn: mockApi.getHotelProfile,
  });
};

export const useUpdateHotelProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.updateHotelProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'hotel-profile'] });
      toast({
        title: 'Success',
        description: 'Hotel profile updated successfully',
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

// Owner Dashboard hooks - Staff Management
export const useOwnerStaff = () => {
  return useQuery({
    queryKey: ['owner', 'staff'],
    queryFn: mockApi.getOwnerStaff,
  });
};

export const useInviteStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.inviteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'staff'] });
      toast({
        title: 'Success',
        description: 'Staff member invited successfully',
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

export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      mockApi.updateStaffMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'staff'] });
      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
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

export const useDeleteStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.deleteStaffMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'staff'] });
      toast({
        title: 'Success',
        description: 'Staff member removed successfully',
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

// Owner Dashboard hooks - Room Categories
export const useOwnerRoomCategories = () => {
  return useQuery({
    queryKey: ['owner', 'room-categories'],
    queryFn: mockApi.getOwnerRoomCategories,
  });
};

export const useCreateRoomCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createRoomCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'room-categories'] });
      toast({
        title: 'Success',
        description: 'Room category created successfully',
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

export const useUpdateRoomCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      mockApi.updateRoomCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'room-categories'] });
      toast({
        title: 'Success',
        description: 'Room category updated successfully',
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

export const useDeleteRoomCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.deleteRoomCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'room-categories'] });
      toast({
        title: 'Success',
        description: 'Room category deleted successfully',
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

// Owner Dashboard hooks - Audit Logs
export const useOwnerAuditLogs = () => {
  return useQuery({
    queryKey: ['owner', 'audit-logs'],
    queryFn: mockApi.getOwnerAuditLogs,
  });
};

// Super Admin hooks - Tenants
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

export const useSuspendTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.suspendTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: 'Tenant suspended successfully',
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

export const useReactivateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.reactivateTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: 'Tenant reactivated successfully',
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.impersonateTenant,
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Impersonation token generated',
      });
      // Open tenant dashboard in new tab
      window.open(data.data.redirectUrl, '_blank');
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

// Templates
export const useTemplates = () => {
  return useQuery({
    queryKey: ['sa', 'templates'],
    queryFn: mockApi.getTemplates,
  });
};

export const useTemplate = (id: string) => {
  return useQuery({
    queryKey: ['sa', 'templates', id],
    queryFn: () => mockApi.getTemplate(id),
    enabled: !!id,
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
    mutationFn: ({ id, data }: { id: string; data: any }) => 
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

// Roles & Permissions
export const useRoles = () => {
  return useQuery({
    queryKey: ['sa', 'roles'],
    queryFn: mockApi.getRoles,
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: ['sa', 'roles', id],
    queryFn: () => mockApi.getRole(id),
    enabled: !!id,
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
    mutationFn: ({ id, data }: { id: string; data: any }) => 
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

// Global User Management
export const useGlobalUsers = () => {
  return useQuery({
    queryKey: ['sa', 'global-users'],
    queryFn: mockApi.getGlobalUsers,
  });
};

export const useGlobalUser = (id: string) => {
  return useQuery({
    queryKey: ['sa', 'global-users', id],
    queryFn: () => mockApi.getGlobalUser(id),
    enabled: !!id,
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
        description: 'Global user created successfully',
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
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      mockApi.updateGlobalUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'global-users'] });
      toast({
        title: 'Success',
        description: 'Global user updated successfully',
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
        description: 'Global user deleted successfully',
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

// Support & Communication
export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['sa', 'support-tickets'],
    queryFn: mockApi.getSupportTickets,
  });
};

export const useSupportTicket = (id: string) => {
  return useQuery({
    queryKey: ['sa', 'support-tickets', id],
    queryFn: () => mockApi.getSupportTicket(id),
    enabled: !!id,
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      mockApi.updateSupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'support-tickets'] });
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

export const useAnnouncements = () => {
  return useQuery({
    queryKey: ['sa', 'announcements'],
    queryFn: mockApi.getAnnouncements,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'announcements'] });
      toast({
        title: 'Success',
        description: 'Announcement created successfully',
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

export const useBroadcastMessage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.broadcastMessage,
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Message sent to ${data.data.sentTo} tenants`,
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

// Super Admin - Plans
export const usePlans = () => {
  return useQuery({
    queryKey: ['sa', 'plans'],
    queryFn: mockApi.getPlans,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => mockApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'plans'] });
      toast({
        title: 'Success',
        description: 'Plan created successfully',
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

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => mockApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'plans'] });
      toast({
        title: 'Success',
        description: 'Plan deleted successfully',
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

export const usePlanMetrics = () => {
  return useQuery({
    queryKey: ['sa', 'plan-metrics'],
    queryFn: mockApi.getPlanMetrics,
  });
};

export const useSendInvoiceReminder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tenantId, type }: { tenantId: string; type: 'overdue' | 'upcoming' }) =>
      mockApi.sendInvoiceReminder(tenantId, type),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice reminder sent successfully',
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

export const useProcessSubscriptionRenewal = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (tenantId: string) => mockApi.processSubscriptionRenewal(tenantId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subscription renewal processed successfully',
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

export const useCheckSubscriptionExpiry = () => {
  return useQuery({
    queryKey: ['sa', 'subscription-expiry'],
    queryFn: mockApi.checkSubscriptionExpiry,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
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

export const useToggleEmergencyMode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.toggleEmergencyMode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'policies'] });
      toast({
        title: 'Success',
        description: `Emergency mode ${data.data.emergencyModeEnabled ? 'enabled' : 'disabled'} for ${data.data.affectedTenants} tenants`,
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

// Bulk Operations
export const useBulkImportTenants = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.bulkImportTenants,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: `Imported ${data.data.imported} tenants successfully`,
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

export const useBulkUpdateTenants = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.bulkUpdateTenants,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({
        title: 'Success',
        description: `Updated ${data.data.updated} tenants successfully`,
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