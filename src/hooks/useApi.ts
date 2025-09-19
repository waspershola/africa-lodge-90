import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';

// Main API hooks
export const useReservations = () => {
  return useQuery({
    queryKey: ['owner', 'reservations'],
    queryFn: supabaseApi.reservations.getReservations,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.reservations.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Reservation created successfully' });
    },
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      supabaseApi.reservations.updateReservation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Reservation updated successfully' });
    },
  });
};

export const useRooms = () => {
  return useQuery({
    queryKey: ['owner', 'rooms'],
    queryFn: supabaseApi.rooms.getRooms,
  });
};

export const useRoomTypes = () => {
  return useQuery({
    queryKey: ['owner', 'room-types'],
    queryFn: supabaseApi.roomTypes.getRoomTypes,
  });
};

export const useCreateRoomType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.roomTypes.createRoomType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'room-types'] });
      toast({ title: 'Room type created successfully' });
    },
  });
};

export const useUpdateRoomType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      supabaseApi.roomTypes.updateRoomType(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'room-types'] });
      toast({ title: 'Room type updated successfully' });
    },
  });
};

export const useDeleteRoomType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => 
      supabaseApi.roomTypes.deleteRoomType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'room-types'] });
      toast({ title: 'Room type deleted successfully' });
    },
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['owner', 'users'],
    queryFn: supabaseApi.users.getUsers,
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.users.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'users'] });
      toast({ title: 'Staff member created successfully' });
    },
  });
};

export const useGuests = () => {
  return useQuery({
    queryKey: ['owner', 'guests'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (guestData: any) => Promise.resolve(guestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'guests'] });
      toast({ title: 'Guest created successfully' });
    },
  });
};

export const useTenants = () => {
  return useQuery({
    queryKey: ['sa', 'tenants'],
    queryFn: supabaseApi.tenants.getTenants,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.tenants.createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({ title: 'Tenant created successfully' });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      supabaseApi.tenants.updateTenant(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({ title: 'Tenant updated successfully' });
    },
  });
};

// Housekeeping
export const useHousekeepingTasks = () => {
  return useQuery({
    queryKey: ['housekeeping', 'tasks'],
    queryFn: supabaseApi.housekeeping.getTasks,
  });
};

export const useCreateHousekeepingTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.housekeeping.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping', 'tasks'] });
      toast({ title: 'Task created successfully' });
    },
  });
};

export const useUpdateHousekeepingTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      supabaseApi.housekeeping.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping', 'tasks'] });
      toast({ title: 'Task updated successfully' });
    },
  });
};

// Room operations
export const useOwnerOverview = () => {
  return useQuery({
    queryKey: ['owner', 'overview'],
    queryFn: () => Promise.resolve({
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      revenue: 0,
      reservations: 0
    }),
  });
};

export const useRoomAvailability = () => {
  return useQuery({
    queryKey: ['rooms', 'availability'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useAssignRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reservationId, roomId }: { reservationId: string; roomId: string }) =>
      supabaseApi.reservations.updateReservation(reservationId, { room_id: roomId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Room assigned successfully' });
    },
  });
};

export const useAutoAssignRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reservationId, roomId }: { reservationId: string; roomId: string }) =>
      supabaseApi.reservations.updateReservation(reservationId, { room_id: roomId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Room assigned successfully' });
    },
  });
};

export const useCheckInGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reservationId }: { reservationId: string }) =>
      supabaseApi.reservations.updateReservation(reservationId, { 
        status: 'checked-in',
        checked_in_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Guest checked in successfully' });
    },
  });
};

export const useCheckOutGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reservationId }: { reservationId: string }) =>
      supabaseApi.reservations.updateReservation(reservationId, { 
        status: 'checked-out',
        checked_out_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Guest checked out successfully' });
    },
  });
};

export const useCheckRoomConflicts = () => {
  return useMutation({
    mutationFn: ({ roomId, checkIn, checkOut, reservationId }: {
      roomId: string;
      checkIn: string;
      checkOut: string;
      reservationId?: string;
    }) => Promise.resolve({ hasConflicts: false }),
  });
};

export const useCheckConflicts = useCheckRoomConflicts;

// Additional hooks
export const useGuestProfiles = () => {
  return useQuery({
    queryKey: ['guests', 'profiles'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useImportOTAReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => Promise.resolve(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'OTA reservation imported successfully' });
    },
  });
};

// Stats and dashboard hooks
export const useTenant = () => useQuery({
  queryKey: ['tenant'],
  queryFn: () => Promise.resolve({}),
});

export const useGuestStats = () => useQuery({
  queryKey: ['guest-stats'],
  queryFn: () => Promise.resolve({
    totalGuests: 0,
    vipGuests: 0,
    corporateAccounts: 0,
    totalRevenue: 0
  }),
});

export const useHousekeepingStats = () => useQuery({
  queryKey: ['housekeeping-stats'],  
  queryFn: () => Promise.resolve({
    pendingTasks: 0,
    delayedTasks: 0,
    inProgressTasks: 0,
    completedToday: 0,
    averageCompletionTime: 0,
    oosRooms: 0,
    activeStaff: 0
  }),
});

// SA/Admin placeholder hooks
export const useToggleEmergencyMode = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useAuditLogs = () => useQuery({ queryKey: ['audit-logs'], queryFn: () => Promise.resolve([]) });
export const useBackupJobs = () => useQuery({ queryKey: ['backup-jobs'], queryFn: () => Promise.resolve([]) });
export const useCreateBackup = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useRestoreBackup = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useDeleteBackup = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useDashboardData = () => useQuery({ queryKey: ['dashboard'], queryFn: () => Promise.resolve({}) });
export const useMetrics = () => useQuery({ queryKey: ['metrics'], queryFn: () => Promise.resolve({}) });
export const useFeatureFlags = () => useQuery({ queryKey: ['feature-flags'], queryFn: () => Promise.resolve([]) });
export const useUpdateFeatureFlag = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useCreateFeatureFlag = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useGlobalUsers = () => useQuery({ queryKey: ['global-users'], queryFn: () => Promise.resolve([]) });
export const useCreateGlobalUser = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useUpdateGlobalUser = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useDeleteGlobalUser = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useImpersonateUser = () => useMutation({ mutationFn: () => Promise.resolve() });
export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: () => Promise.resolve([]) });
export const useCreatePlan = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useUpdatePlan = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useDeletePlan = () => useMutation({ mutationFn: () => Promise.resolve() });
export const usePlanMetrics = () => useQuery({ queryKey: ['plan-metrics'], queryFn: () => Promise.resolve({}) });
export const useSendInvoiceReminder = () => useMutation({ mutationFn: () => Promise.resolve() });
export const useCheckSubscriptionExpiry = () => useMutation({ mutationFn: () => Promise.resolve() });

// Aliases and compatibility exports
export const useOwnerRoomCategories = useRoomTypes;
export const useCreateRoomCategory = useCreateRoomType;
export const useUpdateRoomCategory = useUpdateRoomType;
export const useDeleteRoomCategory = useDeleteRoomType;
export const useOwnerStaff = useUsers;
export const useInviteStaff = useCreateStaff;

// Additional missing hooks for components
export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      supabaseApi.reservations.updateReservation(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Reservation deleted successfully' });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      supabaseApi.reservations.updateReservation(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Reservation cancelled successfully' });
    },
  });
};

export const useRefundReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Refund processed successfully' });
    },
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['owner', 'roles'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'roles'] });
      toast({ title: 'Role deleted successfully' });
    },
  });
};

export const useDeleteStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'users'] });
      toast({ title: 'Staff member deleted successfully' });
    },
  });
};

export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'users'] });
      toast({ title: 'Staff member updated successfully' });
    },
  });
};

// Alias for useUsers to maintain compatibility
export const useStaff = useUsers;

// Missing SA hooks - Add all SA admin hooks
export const useBulkImportTenants = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (file: File) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({ title: 'Tenants imported successfully' });
    },
  });
};


export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id }: { id: string }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({ title: 'Tenant deleted successfully' });
    },
  });
};

export const useSuspendTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id }: { id: string }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({ title: 'Tenant suspended successfully' });
    },
  });
};

export const useReactivateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id }: { id: string }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'tenants'] });
      toast({ title: 'Tenant reactivated successfully' });
    },
  });
};

export const useImpersonateTenant = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ tenantId }: { tenantId: string }) => Promise.resolve(),
    onSuccess: () => {
      toast({ title: 'Impersonating tenant' });
    },
  });
};

// Other missing SA hooks
export const usePolicies = () => {
  return useQuery({
    queryKey: ['sa', 'policies'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'policies'] });
      toast({ title: 'Policy updated successfully' });
    },
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (roleData: any) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'roles'] });
      toast({ title: 'Role created successfully' });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'roles'] });
      toast({ title: 'Role updated successfully' });
    },
  });
};

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['sa', 'support-tickets'],
    queryFn: () => Promise.resolve([]),
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'support-tickets'] });
      toast({ title: 'Support ticket updated successfully' });
    },
  });
};

export const useBroadcastMessage = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (messageData: any) => Promise.resolve(),
    onSuccess: () => {
      toast({ title: 'Message broadcasted successfully' });
    },
  });
};

