import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';

// Owner Dashboard hooks - Hotel Profile
export const useHotelProfile = () => {
  return useQuery({
    queryKey: ['owner', 'hotel-profile'],
    queryFn: () => supabaseApi.tenants.getTenant('current'), // Will be replaced with proper tenant context
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

// Reservation API Hooks
export const useReservations = () => {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: mockApi.getReservations,
    select: (response) => response.data
  });
};

export const useReservation = (id: string) => {
  return useQuery({
    queryKey: ['reservations', id],
    queryFn: () => mockApi.getReservation(id),
    select: (response) => response.data,
    enabled: !!id
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'Reservation created successfully',
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

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mockApi.updateReservation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'Reservation updated successfully',
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

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: string) => mockApi.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'Reservation cancelled successfully',
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

export const useAssignRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ reservationId, roomNumber }: { reservationId: string; roomNumber: string }) => 
      mockApi.assignRoom(reservationId, roomNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'Room assigned successfully',
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

export const useCheckInGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (reservationId: string) => mockApi.checkInGuest(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'Guest checked in successfully',
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

export const useCheckOutGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (reservationId: string) => mockApi.checkOutGuest(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'Guest checked out successfully',
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

export const useRoomAvailability = (checkIn?: Date, checkOut?: Date) => {
  return useQuery({
    queryKey: ['room-availability', checkIn, checkOut],
    queryFn: () => mockApi.getRoomAvailability(checkIn, checkOut),
    select: (response) => response.data
  });
};

// API hooks for enhanced features
export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: mockApi.getCompanies,
    select: (response) => response.data
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: 'Success',
        description: 'Company created successfully',
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

export const useGuestProfiles = () => {
  return useQuery({
    queryKey: ['guest-profiles'],
    queryFn: mockApi.getGuestProfiles,
    select: (response) => response.data
  });
};

export const useCreateGuestProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.createGuestProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-profiles'] });
      toast({
        title: 'Success',
        description: 'Guest profile created successfully',
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

export const useAutoAssignRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.autoAssignRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'Room auto-assigned successfully',
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

export const useImportOTAReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.importOTAReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: 'Success',
        description: 'OTA reservation imported successfully',
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

export const useCheckRoomConflicts = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.checkRoomConflicts(data),
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
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

export const useImpersonateUser = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, reason, durationMinutes }: { userId: string; reason: string; durationMinutes: number }) => 
      mockApi.impersonateUser(userId, reason, durationMinutes),
    onSuccess: (data) => {
      toast({
        title: 'Impersonation Started',
        description: 'You are now impersonating the user. Session will expire automatically.',
      });
      // Here you would typically store the impersonation token and show the banner
      // For now, we'll just show a success message
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

// Billing API Hooks
export const useBills = () => {
  return useQuery({
    queryKey: ['bills'],
    queryFn: mockApi.getBills,
    select: (response) => response.data
  });
};

export const useAddChargeToBill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ billId, chargeData }: { billId: string; chargeData: any }) => 
      mockApi.addChargeToBill(billId, chargeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast({
        title: 'Success',
        description: 'Charge added successfully',
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

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (paymentData: any) => mockApi.recordPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
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

export const useBillingStats = () => {
  return useQuery({
    queryKey: ['billing-stats'],
    queryFn: mockApi.getBillingStats,
    select: (response) => response.data
  });
};

// Guest Management API Hooks
export const useGuests = () => {
  return useQuery({
    queryKey: ['guests'],
    queryFn: mockApi.getGuests,
    select: (response) => response.data
  });
};

export const useGuest = (id: string) => {
  return useQuery({
    queryKey: ['guests', id],
    queryFn: () => mockApi.getGuest(id),
    select: (response) => response.data,
    enabled: !!id
  });
};

export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.createGuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest-stats'] });
      toast({
        title: 'Success',
        description: 'Guest created successfully',
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

export const useUpdateGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mockApi.updateGuest(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
      toast({
        title: 'Success',
        description: 'Guest updated successfully',
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

export const useGuestStats = () => {
  return useQuery({
    queryKey: ['guest-stats'],
    queryFn: mockApi.getGuestStats,
    select: (response) => response.data
  });
};

export const useCorporateAccounts = () => {
  return useQuery({
    queryKey: ['corporate-accounts'],
    queryFn: mockApi.getCorporateAccounts,
    select: (response) => response.data
  });
};

// Housekeeping Management API Hooks
export const useHousekeepingStats = () => {
  return useQuery({
    queryKey: ['housekeeping-stats'],
    queryFn: mockApi.getHousekeepingStats,
    select: (response) => response.data
  });
};

export const useHousekeepingTasks = () => {
  return useQuery({
    queryKey: ['housekeeping-tasks'],
    queryFn: mockApi.getHousekeepingTasks,
    select: (response) => response.data
  });
};

export const useCreateHousekeepingTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.createHousekeepingTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
      toast({
        title: 'Success',
        description: 'Task created successfully',
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

export const useUpdateHousekeepingTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mockApi.updateHousekeepingTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
      toast({
        title: 'Success',
        description: 'Task updated successfully',
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

export const useOOSRooms = () => {
  return useQuery({
    queryKey: ['oos-rooms'],
    queryFn: mockApi.getOOSRooms,
    select: (response) => response.data
  });
};

export const useCreateOOSRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: any) => mockApi.createOOSRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oos-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
      toast({
        title: 'Success',
        description: 'OOS room created successfully',
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

export const useUpdateOOSRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mockApi.updateOOSRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oos-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
      toast({
        title: 'Success',
        description: 'OOS room updated successfully',
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

// Feature Flags API hooks
export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['sa', 'feature-flags'],
    queryFn: mockApi.getFeatureFlags,
  });
};

export const useCreateFeatureFlag = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'feature-flags'] });
      toast({
        title: 'Success',
        description: 'Feature flag created successfully',
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

export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      mockApi.updateFeatureFlag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'feature-flags'] });
      toast({
        title: 'Success',
        description: 'Feature flag updated successfully',
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

// Owner Dashboard Hooks  
export const useOwnerOverview = () => {
  return useQuery({
    queryKey: ['owner', 'overview'],
    queryFn: () => mockApi.getOwnerOverview()
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: string) => mockApi.cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({ title: "Reservation cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to cancel reservation", variant: "destructive" });
    }
  });
};

export const useRefundReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: string) => mockApi.refundReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({ title: "Refund processed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to process refund", variant: "destructive" });
    }
  });
};

// Owner API hooks continued
export const useOwnerAudit = (filters?: any) => {
  return useQuery({
    queryKey: ['owner', 'audit', filters],
    queryFn: () => mockApi.getOwnerAudit(filters)
  });
};

export const useOwnerReports = () => {
  return useQuery({
    queryKey: ['owner', 'reports'],
    queryFn: mockApi.getOwnerReports
  });
};

// Backup & Restore API hooks
export const useBackupJobs = () => {
  return useQuery({
    queryKey: ['sa', 'backup-jobs'],
    queryFn: mockApi.getBackupJobs,
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'backup-jobs'] });
      toast({
        title: 'Success',
        description: 'Backup job started successfully',
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

export const useRestoreBackup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ backupId, ...options }: { backupId: string; [key: string]: any }) => 
      mockApi.restoreBackup(backupId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'backup-jobs'] });
      toast({
        title: 'Success',
        description: 'Restore process initiated successfully',
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

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mockApi.deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'backup-jobs'] });
      toast({
        title: 'Success',
        description: 'Backup deleted successfully',
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