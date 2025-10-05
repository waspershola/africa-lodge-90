import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay, endOfDay, addDays, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface ReservationFilters {
  status?: ReservationStatus[];
  checkInDate?: Date;
  checkOutDate?: Date;
  guestName?: string;
  roomId?: string;
}

// Fetch reservations with filters
export function useReservations(filters?: ReservationFilters) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['reservations', tenantId, filters],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      let query = supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, vip_status),
          room:rooms(id, room_number, room_type:room_types(name, base_rate))
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.checkInDate) {
        query = query.gte('check_in_date', format(filters.checkInDate, 'yyyy-MM-dd'));
      }
      if (filters?.checkOutDate) {
        query = query.lte('check_out_date', format(filters.checkOutDate, 'yyyy-MM-dd'));
      }
      if (filters?.guestName) {
        query = query.ilike('guest_name', `%${filters.guestName}%`);
      }
      if (filters?.roomId) {
        query = query.eq('room_id', filters.roomId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!tenantId,
  });
}

// Fetch today's arrivals
export function useTodayArrivals() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['arrivals', tenantId, today],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(first_name, last_name, phone, email),
          room:rooms(room_number, room_type:room_types(name))
        `)
        .eq('tenant_id', tenantId)
        .eq('check_in_date', today)
        .in('status', ['pending', 'confirmed', 'checked_in'])
        .order('check_in_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}

// Fetch today's departures
export function useTodayDepartures() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['departures', tenantId, today],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guest:guests(first_name, last_name, phone, email),
          room:rooms(room_number, room_type:room_types(name))
        `)
        .eq('tenant_id', tenantId)
        .eq('check_out_date', today)
        .in('status', ['checked_in', 'checked_out'])
        .order('check_out_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}

// Check room availability
export function useRoomAvailability(checkInDate: Date, checkOutDate: Date, roomTypeId?: string) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['room-availability', tenantId, checkInDate, checkOutDate, roomTypeId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      // Call the get_available_rooms function
      const { data, error } = await supabase.rpc('get_available_rooms', {
        p_tenant_id: tenantId,
        p_check_in_date: format(checkInDate, 'yyyy-MM-dd'),
        p_check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
        p_room_type_id: roomTypeId || null,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !!checkInDate && !!checkOutDate,
  });
}

// Fetch group reservations
export function useGroupReservations() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['group-reservations', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('group_reservations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('check_in_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}

// Fetch booking verification status
export function useBookingVerification(reservationId: string) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['booking-verification', tenantId, reservationId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('booking_verification')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('reservation_id', reservationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!tenantId && !!reservationId,
  });
}

// Create reservation mutation
export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async (reservationData: any) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('reservations')
        .insert([{ ...reservationData, tenant_id: tenantId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['arrivals', tenantId] });
      toast.success('Reservation created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create reservation: ${error.message}`);
    },
  });
}

// Update reservation mutation
export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['arrivals', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['departures', tenantId] });
      toast.success('Reservation updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update reservation: ${error.message}`);
    },
  });
}

// Check-in mutation
export function useCheckIn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', reservationId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      // Update room status to occupied
      if (data.room_id) {
        await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', data.room_id)
          .eq('tenant_id', tenantId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['arrivals', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', tenantId] });
      toast.success('Guest checked in successfully');
    },
    onError: (error) => {
      toast.error(`Check-in failed: ${error.message}`);
    },
  });
}

// Check-out mutation
export function useCheckOut() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'checked_out',
          checked_out_at: new Date().toISOString(),
        })
        .eq('id', reservationId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      // Update room status to cleaning
      if (data.room_id) {
        await supabase
          .from('rooms')
          .update({ status: 'cleaning' })
          .eq('id', data.room_id)
          .eq('tenant_id', tenantId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['departures', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', tenantId] });
      toast.success('Guest checked out successfully');
    },
    onError: (error) => {
      toast.error(`Check-out failed: ${error.message}`);
    },
  });
}

// Cancel reservation mutation
export function useCancelReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      // Free up the room if assigned
      if (data.room_id) {
        await supabase
          .from('rooms')
          .update({ status: 'available' })
          .eq('id', data.room_id)
          .eq('tenant_id', tenantId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', tenantId] });
      toast.success('Reservation cancelled');
    },
    onError: (error) => {
      toast.error(`Cancellation failed: ${error.message}`);
    },
  });
}

// Combined hook for reservation management
export function useReservationsManagement() {
  const reservations = useReservations();
  const todayArrivals = useTodayArrivals();
  const todayDepartures = useTodayDepartures();
  const groupReservations = useGroupReservations();
  
  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();

  return {
    // Data
    reservations: reservations.data || [],
    todayArrivals: todayArrivals.data || [],
    todayDepartures: todayDepartures.data || [],
    groupReservations: groupReservations.data || [],
    
    // Loading states
    isLoading: reservations.isLoading || todayArrivals.isLoading || 
               todayDepartures.isLoading || groupReservations.isLoading,
    
    // Mutations
    createReservation: createReservation.mutate,
    updateReservation: updateReservation.mutate,
    checkIn: checkIn.mutate,
    checkOut: checkOut.mutate,
    cancelReservation: cancelReservation.mutate,
    
    // Mutation states
    isCreating: createReservation.isPending,
    isUpdating: updateReservation.isPending,
    isCheckingIn: checkIn.isPending,
    isCheckingOut: checkOut.isPending,
    isCancelling: cancelReservation.isPending,
  };
}
