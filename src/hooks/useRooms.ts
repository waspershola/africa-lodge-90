import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      // Fetch rooms with room types and current reservations
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_type:room_type_id (*),
          current_reservation:reservations!inner(
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
        .eq('reservations.status', 'checked_in')
        .order('room_number');

      if (roomsError && roomsError.code !== 'PGRST116') throw roomsError; // Ignore "no rows" error

      // Also fetch rooms without current reservations
      const { data: allRoomsData, error: allRoomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_type:room_type_id (*),
          reservations!left(
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

      // Get folio balances for occupied rooms
      const { data: folioData, error: folioError } = await supabase
        .from('folios')
        .select(`
          id,
          balance,
          total_charges,
          total_payments,
          status,
          reservations!inner(room_id)
        `)
        .eq('status', 'open');

      if (folioError && folioError.code !== 'PGRST116') throw folioError;

      // Create folio map for quick lookup
      const folioMap = new Map();
      folioData?.forEach(folio => {
        if (folio.reservations?.room_id) {
          folioMap.set(folio.reservations.room_id, {
            balance: folio.balance || 0,
            isPaid: (folio.balance || 0) <= 0,
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

// Reservations query hook
export const useReservations = () => {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms:room_id (room_number, room_types:room_type_id (name)),
          guests:guest_id (first_name, last_name, email, phone, vip_status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
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

// Update room mutation
export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Room updated successfully"
      });
    },
    onError: (error) => {
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