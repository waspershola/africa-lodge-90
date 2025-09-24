import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface Room {
  id: string;
  tenant_id: string;
  room_number: string;
  room_type_id: string;
  floor?: number;
  status: 'available' | 'occupied' | 'dirty' | 'maintenance' | 'out_of_order';
  notes?: string;
  last_cleaned?: string;
  created_at?: string;
  updated_at?: string;
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
  amenities?: string[];
  created_at?: string;
}

export interface Reservation {
  id: string;
  tenant_id: string;
  room_id: string;
  reservation_number: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  guest_id_number?: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  room_rate: number;
  total_amount?: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  checked_in_at?: string;
  checked_out_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadRooms();
      loadRoomTypes();
    }
  }, [user?.tenant_id]);

  const loadRooms = async () => {
    if (!user?.tenant_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types:room_type_id (*),
          reservations:reservations!room_id (
            *
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .order('room_number');

      if (error) throw error;

      const processedRooms: Room[] = (data || []).map(room => ({
        id: room.id,
        tenant_id: room.tenant_id,
        room_number: room.room_number,
        room_type_id: room.room_type_id,
        floor: room.floor,
        status: room.status as Room['status'],
        notes: room.notes,
        last_cleaned: room.last_cleaned,
        created_at: room.created_at,
        updated_at: room.updated_at,
        room_type: room.room_types ? {
          id: room.room_types.id,
          tenant_id: room.room_types.tenant_id,
          name: room.room_types.name,
          description: room.room_types.description,
          base_rate: Number(room.room_types.base_rate),
          max_occupancy: room.room_types.max_occupancy,
          amenities: room.room_types.amenities,
          created_at: room.room_types.created_at
        } : undefined,
        current_reservation: room.reservations?.find((r: any) => r.status === 'checked_in') ? {
          id: room.reservations[0].id,
          tenant_id: room.reservations[0].tenant_id,
          room_id: room.reservations[0].room_id,
          reservation_number: room.reservations[0].reservation_number,
          guest_name: room.reservations[0].guest_name,
          guest_email: room.reservations[0].guest_email,
          guest_phone: room.reservations[0].guest_phone,
          guest_id_number: room.reservations[0].guest_id_number,
          check_in_date: room.reservations[0].check_in_date,
          check_out_date: room.reservations[0].check_out_date,
          adults: room.reservations[0].adults,
          children: room.reservations[0].children,
          room_rate: Number(room.reservations[0].room_rate),
          total_amount: room.reservations[0].total_amount ? Number(room.reservations[0].total_amount) : undefined,
          status: room.reservations[0].status as Reservation['status'],
          checked_in_at: room.reservations[0].checked_in_at,
          checked_out_at: room.reservations[0].checked_out_at,
          checked_in_by: room.reservations[0].checked_in_by,
          checked_out_by: room.reservations[0].checked_out_by,
          created_by: room.reservations[0].created_by,
          created_at: room.reservations[0].created_at,
          updated_at: room.reservations[0].updated_at
        } : undefined
      }));

      setRooms(processedRooms);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoomTypes = async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('name');

      if (error) throw error;

      const processedRoomTypes: RoomType[] = (data || []).map(type => ({
        id: type.id,
        tenant_id: type.tenant_id,
        name: type.name,
        description: type.description,
        base_rate: Number(type.base_rate),
        max_occupancy: type.max_occupancy,
        amenities: type.amenities,
        created_at: type.created_at
      }));

      setRoomTypes(processedRoomTypes);
    } catch (err: any) {
      console.error('Failed to load room types:', err);
    }
  };

  const updateRoomStatus = async (roomId: string, status: Room['status'], notes?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status,
          notes,
          updated_at: new Date().toISOString(),
          ...(status === 'available' && { last_cleaned: new Date().toISOString() })
        })
        .eq('id', roomId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'room_status_updated',
          resource_type: 'room',
          resource_id: roomId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Room status changed to ${status}`,
          new_values: { status, notes }
        }]);

      await loadRooms();
      
      toast({
        title: "Room Updated",
        description: `Room status changed to ${status}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update room status",
        variant: "destructive"
      });
    }
  };

  const checkInGuest = async (reservationId: string, roomId: string) => {
    if (!user) return;

    try {
      // Update reservation status
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id
        })
        .eq('id', reservationId);

      if (reservationError) throw reservationError;

      // Update room status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId);

      if (roomError) throw roomError;

      // Create folio for the reservation
      const { data: reservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (reservation) {
        const { error: folioError } = await supabase
          .from('folios')
          .insert([{
            reservation_id: reservationId,
            folio_number: `F-${reservation.reservation_number}`,
            status: 'open',
            tenant_id: user.tenant_id
          }]);

        if (folioError) throw folioError;
      }

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'guest_checked_in',
          resource_type: 'reservation',
          resource_id: reservationId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Guest checked in to room`
        }]);

      await loadRooms();
      
      toast({
        title: "Check-in Complete",
        description: "Guest has been checked in successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to check in guest",
        variant: "destructive"
      });
    }
  };

  const createReservation = async (reservationData: Omit<Reservation, 'id' | 'tenant_id' | 'reservation_number' | 'created_at' | 'updated_at'>) => {
    if (!user?.tenant_id) return;

    try {
      const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          ...reservationData,
          tenant_id: user.tenant_id,
          reservation_number: reservationNumber,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'reservation_created',
          resource_type: 'reservation',
          resource_id: data.id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Reservation created for ${reservationData.guest_name}`,
          new_values: reservationData
        }]);

      await loadRooms();
      
      toast({
        title: "Reservation Created",
        description: `Reservation ${reservationNumber} created successfully.`,
      });

      return data;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create reservation",
        variant: "destructive"
      });
      throw err;
    }
  };

  return {
    rooms,
    roomTypes,
    loading,
    error,
    updateRoomStatus,
    checkInGuest,
    createReservation,
    refresh: loadRooms
  };
}

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadReservations();
    }
  }, [user?.tenant_id]);

  const loadReservations = async () => {
    if (!user?.tenant_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms:room_id (room_number, room_types:room_type_id (name))
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedReservations: Reservation[] = (data || []).map(reservation => ({
        id: reservation.id,
        tenant_id: reservation.tenant_id,
        room_id: reservation.room_id,
        reservation_number: reservation.reservation_number,
        guest_name: reservation.guest_name,
        guest_email: reservation.guest_email,
        guest_phone: reservation.guest_phone,
        guest_id_number: reservation.guest_id_number,
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        adults: reservation.adults,
        children: reservation.children,
        room_rate: Number(reservation.room_rate),
        total_amount: reservation.total_amount ? Number(reservation.total_amount) : undefined,
        status: reservation.status as Reservation['status'],
        checked_in_at: reservation.checked_in_at,
        checked_out_at: reservation.checked_out_at,
        checked_in_by: reservation.checked_in_by,
        checked_out_by: reservation.checked_out_by,
        created_by: reservation.created_by,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at
      }));

      setReservations(processedReservations);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    reservations,
    loading,
    error,
    refresh: loadReservations
  };
}