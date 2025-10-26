// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFeatureFlag } from './useFeatureFlags';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface Room {
  id: string;
  tenant_id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
  notes?: string;
  created_at: string;
  updated_at: string;
  room_type?: RoomType;
  current_reservation?: Reservation;
}

export interface RoomType {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  base_rate: number;
  max_occupancy: number;
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  tenant_id: string;
  guest_id?: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  room_rate: number;
  total_amount: number;
  reservation_number: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  created_at: string;
  updated_at: string;
  rooms?: Room;
  guests?: any;
}


// Main hook for rooms data using React Query with real reservation integration
// Maintains backward compatibility - returns same structure as before
// Real-time updates handled by useUnifiedRealtime globally
export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    meta: { 
      priority: 'critical',
      maxAge: 30000 // 30 seconds
    },
    staleTime: 30 * 1000, // 30 seconds - critical for hotel operations
    queryFn: async () => {
      // Fetch rooms with room types and current reservations
      const { data: allRoomsData, error: allRoomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_type:room_type_id (*),
          reservations!reservations_room_id_fkey(
            id,
            guest_name,
            guest_email,
            guest_phone,
            check_in_date,
            check_out_date,
            status,
            total_amount,
            reservation_number,
            guests:guest_id (
              first_name,
              last_name,
              email,
              phone,
              vip_status
            )
          )
        `)
        .order('room_number');

      if (allRoomsError) throw allRoomsError;

      // PHASE 3.1: Real-time balance calculation (CRITICAL FIX)
      // Calculate balance client-side from charges - payments
      const { data: folioData, error: folioError } = await supabase
        .from('folios')
        .select(`
          id,
          total_charges,
          total_payments,
          status,
          reservations!inner(room_id, status)
        `)
        .eq('status', 'open')
        .in('reservations.status', ['confirmed', 'checked_in']);

      if (folioError && folioError.code !== 'PGRST116') throw folioError;

      // Create folio map with CALCULATED balance (not from DB)
      const folioMap = new Map();
      folioData?.forEach(folio => {
        if (folio.reservations?.room_id) {
          // Calculate balance: charges - payments
          const balance = (folio.total_charges || 0) - (folio.total_payments || 0);
          
          // Determine 4-state payment status
          let status: 'paid' | 'unpaid' | 'partial' | 'overpaid';
          if (balance <= -0.01) {
            status = 'overpaid';
          } else if (Math.abs(balance) < 0.01) {
            status = 'paid';
          } else if (folio.total_payments > 0) {
            status = 'partial';
          } else {
            status = 'unpaid';
          }
          
          folioMap.set(folio.reservations.room_id, {
            balance: Math.max(0, balance), // Don't show negative as balance
            isPaid: balance <= 0.01,
            status,
            creditAmount: balance < -0.01 ? Math.abs(balance) : 0,
            total_charges: folio.total_charges || 0,
            total_payments: folio.total_payments || 0
          });
        }
      });

      // Process rooms to include reservation and folio data
      const processedRooms = allRoomsData?.map(room => {
        const currentReservation = room.reservations?.find(
          res => res.status === 'checked_in' || res.status === 'confirmed'
        );
        
        return {
          ...room,
          current_reservation: currentReservation,
          folio: folioMap.get(room.id) || null,
          last_cleaned: room.last_cleaned,
          updated_at: room.updated_at
        };
      }) || [];

      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('room_types')
        .select('*')
        .order('name');

      if (roomTypesError) throw roomTypesError;

      return {
        rooms: processedRooms,
        roomTypes: roomTypesData || []
      };
    },
  });
};

/**
 * Hook for paginated rooms with feature flag support
 * Use this when you need pagination controls
 * Real-time updates handled by useUnifiedRealtime globally
 */
export const usePaginatedRooms = (limit: number = 100, offset: number = 0) => {
  const { data: paginationEnabled } = useFeatureFlag('ff/paginated_reservations');

  return useQuery({
    queryKey: ['rooms', 'paginated', limit, offset, paginationEnabled],
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select(`
          *,
          room_type:room_type_id (*),
          reservations!reservations_room_id_fkey(
            id, guest_name, guest_email, guest_phone,
            check_in_date, check_out_date, status, total_amount,
            reservation_number,
            guests:guest_id (first_name, last_name, email, phone, vip_status)
          )
        `, { count: 'exact' })
        .order('room_number');

      // Apply pagination if feature flag is enabled
      if (paginationEnabled) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data: allRoomsData, error: allRoomsError, count } = await query;

      if (allRoomsError) throw allRoomsError;

      // PHASE 3.1: Real-time balance calculation (paginated)
      const { data: folioData, error: folioError } = await supabase
        .from('folios')
        .select('id, total_charges, total_payments, status, reservations!inner(room_id, status)')
        .eq('status', 'open')
        .in('reservations.status', ['confirmed', 'checked_in'])
        .limit(1000);

      if (folioError && folioError.code !== 'PGRST116') throw folioError;

      // Create folio map with calculated balance
      const folioMap = new Map();
      folioData?.forEach(folio => {
        if (folio.reservations?.room_id) {
          const balance = (folio.total_charges || 0) - (folio.total_payments || 0);
          
          let status: 'paid' | 'unpaid' | 'partial' | 'overpaid';
          if (balance <= -0.01) {
            status = 'overpaid';
          } else if (Math.abs(balance) < 0.01) {
            status = 'paid';
          } else if (folio.total_payments > 0) {
            status = 'partial';
          } else {
            status = 'unpaid';
          }
          
          folioMap.set(folio.reservations.room_id, {
            balance: Math.max(0, balance),
            isPaid: balance <= 0.01,
            status,
            creditAmount: balance < -0.01 ? Math.abs(balance) : 0,
            total_charges: folio.total_charges || 0,
            total_payments: folio.total_payments || 0
          });
        }
      });

      const processedRooms = allRoomsData?.map(room => {
        const currentReservation = room.reservations?.find(
          res => res.status === 'checked_in' || res.status === 'confirmed'
        );
        
        return {
          ...room,
          current_reservation: currentReservation,
          folio: folioMap.get(room.id) || null,
        };
      }) || [];

      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('room_types')
        .select('*')
        .order('name');

      if (roomTypesError) throw roomTypesError;

      return {
        rooms: processedRooms,
        roomTypes: roomTypesData || [],
        count: count || 0,
        hasMore: paginationEnabled ? (count || 0) > offset + limit : false,
      };
    },
  });
};

// Reservations query hook with pagination support
export const useReservations = (limit: number = 100, offset: number = 0) => {
  const { tenant } = useAuth();
  const { data: paginationEnabled } = useFeatureFlag('ff/paginated_reservations');

  return useQuery({
    queryKey: ['reservations', tenant?.tenant_id, limit, offset, paginationEnabled],
    meta: { 
      priority: 'critical',
      maxAge: 30000 // 30 seconds
    },
    staleTime: 30 * 1000, // 30 seconds - critical for booking operations
    queryFn: async () => {
      if (!tenant?.tenant_id) {
        throw new Error('No tenant context available');
      }

      // PHASE 3: Add folio data to reservation query
      let query = supabase
        .from('reservations')
        .select(`
          *,
          rooms!reservations_room_id_fkey (room_number, room_types:room_type_id (name)),
          guests:guest_id (first_name, last_name, email, phone, vip_status),
          folios!folios_reservation_id_fkey (
            id,
            total_charges,
            total_payments,
            status
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      // Apply pagination if feature flag is enabled
      if (paginationEnabled) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);
      
      // PHASE 3.1: Calculate balance for each reservation
      const processedReservations = (data || []).map(res => ({
        ...res,
        folioBalance: res.folios?.[0] ? 
          Math.max(0, (res.folios[0].total_charges || 0) - (res.folios[0].total_payments || 0)) : 0,
        folioPaid: res.folios?.[0] ? 
          ((res.folios[0].total_charges || 0) - (res.folios[0].total_payments || 0)) <= 0.01 : true,
      }));
      
      return {
        reservations: processedReservations,
        count: count || 0,
        hasMore: paginationEnabled ? (count || 0) > offset + limit : false
      };
    },
    enabled: !!tenant?.tenant_id,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roomData: {
      room_number: string;
      room_type_id: string;
      floor: number;
      status?: string;
      notes?: string;
    }) => {
      // Get current user to add tenant_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          room_number: roomData.room_number,
          room_type_id: roomData.room_type_id,
          floor: roomData.floor,
          status: roomData.status || 'available',
          notes: roomData.notes,
          tenant_id: user.user_metadata?.tenant_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast({
        title: "Success",
        description: "Room created successfully"
      });
    },
    onError: (error) => {
      console.error('Room creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    }
  });
};

// Update room mutation with optimistic updates
export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomData: {
      id: string;
      room_number?: string;
      floor?: number;
      status?: Room['status'];
      notes?: string;
    }) => {
      const { id, ...updateData } = roomData;
      const { data, error } = await supabase
        .from('rooms')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (roomData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['rooms'] });

      // Snapshot previous value
      const previousRooms = queryClient.getQueryData(['rooms', user?.tenant_id]);

      // Optimistic update
      queryClient.setQueryData(['rooms', user?.tenant_id], (old: Room[] = []) => {
        return old.map(room => 
          room.id === roomData.id 
            ? { ...room, ...roomData }
            : room
        );
      });

      return { previousRooms };
    },
    onSuccess: (data) => {
      // Immediate invalidation for real-time sync
      queryClient.invalidateQueries({ queryKey: ['rooms', user?.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ['room-availability', user?.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ['room-types', user?.tenant_id] });
      toast({
        title: "Success",
        description: `Room ${data.room_number} updated successfully`
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousRooms) {
        queryClient.setQueryData(['rooms', user?.tenant_id], context.previousRooms);
      }
      console.error('Room update error:', error);
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive"
      });
    }
  });
};

// Delete room mutation
export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast({
        title: "Success",
        description: "Room deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Room deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive"
      });
    }
  });
};