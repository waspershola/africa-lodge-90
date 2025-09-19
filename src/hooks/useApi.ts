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
    mutationFn: (updates: any) => supabaseApi.tenants.updateTenant('current', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'hotel-profile'] });
      toast({ title: 'Hotel profile updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update hotel profile', variant: 'destructive' });
    },
  });
};

// Room Management
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
    mutationFn: ({ id }: { id: string }) => supabaseApi.roomTypes.deleteRoomType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'room-types'] });
      toast({ title: 'Room type deleted successfully' });
    },
  });
};

// Reservations
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

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => supabaseApi.reservations.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'reservations'] });
      toast({ title: 'Reservation deleted successfully' });
    },
  });
};

// Guests
export const useGuests = () => {
  return useQuery({
    queryKey: ['owner', 'guests'],
    queryFn: () => supabaseApi.users.getUsers(), // Placeholder - will be replaced with proper guest API
  });
};

export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.users.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'guests'] });
      toast({ title: 'Guest created successfully' });
    },
  });
};

// Staff Management
export const useStaff = () => {
  return useQuery({
    queryKey: ['owner', 'staff'],
    queryFn: () => supabaseApi.users.getUsers(),
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['owner', 'roles'],
    queryFn: () => [], // Placeholder - will be replaced with proper roles API
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (role: any) => Promise.resolve(role), // Placeholder
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'roles'] });
      toast({ title: 'Role created successfully' });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => Promise.resolve(), // Placeholder
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'roles'] });
      toast({ title: 'Role deleted successfully' });
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

// Maintenance
export const useWorkOrders = () => {
  return useQuery({
    queryKey: ['maintenance', 'work-orders'],
    queryFn: supabaseApi.maintenance.getWorkOrders,
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.maintenance.createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'work-orders'] });
      toast({ title: 'Work order created successfully' });
    },
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      supabaseApi.maintenance.updateWorkOrder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'work-orders'] });
      toast({ title: 'Work order updated successfully' });
    },
  });
};

// POS
export const useMenuItems = () => {
  return useQuery({
    queryKey: ['pos', 'menu-items'],
    queryFn: supabaseApi.pos.getMenuItems,
  });
};

export const useMenuCategories = () => {
  return useQuery({
    queryKey: ['pos', 'menu-categories'],
    queryFn: supabaseApi.pos.getMenuCategories,
  });
};

export const usePOSOrders = () => {
  return useQuery({
    queryKey: ['pos', 'orders'],
    queryFn: supabaseApi.pos.getOrders,
  });
};

export const useCreatePOSOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supabaseApi.pos.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'orders'] });
      toast({ title: 'Order created successfully' });
    },
  });
};

// QR Codes
export const useQRCodes = () => {
  return useQuery({
    queryKey: ['qr', 'codes'],
    queryFn: supabaseApi.qr.getQRCodes,
  });
};

export const useQROrders = () => {
  return useQuery({
    queryKey: ['qr', 'orders'],
    queryFn: supabaseApi.qr.getQROrders,
  });
};

// Super Admin - Tenants
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

export const useCreateStaff = useCreateGuest;
export const useDeleteStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => supabaseApi.users.updateUser(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'staff'] });
      toast({ title: 'Staff member deleted successfully' });
    },
  });
};

export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => supabaseApi.users.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'staff'] });
      toast({ title: 'Staff member updated successfully' });
    },
  });
};
