import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RoomType {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  base_rate: number;
  max_occupancy: number;
  amenities: string[];
  available_count: number;
  reserved_count: number;
  total_count: number;
  auto_assign_hours: number;
  grace_period_hours: number;
  created_at: string;
  updated_at: string;
}

export interface SoftHoldReservationData {
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  guest_id_number?: string;
  room_type_id: string; // Changed from room_id to room_type_id for soft holds
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  room_rate: number;
  booking_source: 'online' | 'walk_in' | 'phone' | 'email';
  requires_verification?: boolean;
  payment_method?: 'prepaid' | 'pay_on_arrival' | 'pay_later';
  special_requests?: string;
  guest_reliability_score?: number;
}

export interface HardAssignmentData {
  reservation_id: string;
  room_id: string;
  assigned_by: string;
  assignment_reason?: string;
}

// Hook for creating soft hold reservations (African context)
export const useCreateSoftHoldReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservationData: SoftHoldReservationData) => {
      // Get current user to add tenant_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const tenant_id = user.user_metadata?.tenant_id;
      if (!tenant_id) throw new Error('No tenant ID found');

      // Check room type availability
      const { data: availabilityCheck, error: availabilityError } = await supabase
        .rpc('check_room_type_availability', {
          p_tenant_id: tenant_id,
          p_room_type_id: reservationData.room_type_id,
          p_check_in_date: reservationData.check_in_date,
          p_check_out_date: reservationData.check_out_date
        });

      if (availabilityError) throw availabilityError;
      if (!availabilityCheck) throw new Error('No rooms available for this type and date range');

      // Calculate dates and amounts
      const checkInDate = new Date(reservationData.check_in_date);
      const checkOutDate = new Date(reservationData.check_out_date);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * reservationData.room_rate;

      // Generate reservation number
      const reservationNumber = `RES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Get auto-cancel policy for this room type
      const { data: cancelPolicy } = await supabase
        .from('auto_cancel_policies')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('room_type_id', reservationData.room_type_id)
        .eq('is_active', true)
        .single();

      // Set expiry times based on policy and payment method
      const now = new Date();
      let paymentDeadline: Date | null = null;
      let verificationDeadline: Date | null = null;
      let expiresAt: Date | null = null;

      if (reservationData.payment_method === 'pay_on_arrival' || reservationData.payment_method === 'pay_later') {
        // Set payment deadline
        const hoursToAdd = cancelPolicy?.unpaid_cancel_hours || 6;
        paymentDeadline = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
        expiresAt = paymentDeadline;
      }

      if (reservationData.requires_verification) {
        const hoursToAdd = cancelPolicy?.unverified_cancel_hours || 2;
        verificationDeadline = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
        if (!expiresAt || verificationDeadline < expiresAt) {
          expiresAt = verificationDeadline;
        }
      }

      // Create or find guest
      let guestId: string;
      
      if (reservationData.guest_email) {
        const { data: existingGuest } = await supabase
          .from('guests')
          .select('id, reliability_score')
          .eq('tenant_id', tenant_id)
          .eq('email', reservationData.guest_email)
          .single();

        if (existingGuest) {
          guestId = existingGuest.id;
        } else {
          const { data: newGuest, error: guestError } = await supabase
            .from('guests')
            .insert({
              tenant_id,
              first_name: reservationData.guest_name.split(' ')[0] || reservationData.guest_name,
              last_name: reservationData.guest_name.split(' ').slice(1).join(' ') || '',
              email: reservationData.guest_email,
              phone: reservationData.guest_phone,
              guest_id_number: reservationData.guest_id_number,
              reliability_score: reservationData.guest_reliability_score || 100
            })
            .select('id')
            .single();

          if (guestError) throw guestError;
          guestId = newGuest.id;
        }
      } else {
        // Create guest without email
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            tenant_id,
            first_name: reservationData.guest_name.split(' ')[0] || reservationData.guest_name,
            last_name: reservationData.guest_name.split(' ').slice(1).join(' ') || '',
            phone: reservationData.guest_phone,
            guest_id_number: reservationData.guest_id_number,
            reliability_score: reservationData.guest_reliability_score || 100
          })
          .select('id')
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
      }

      // Create soft hold reservation
      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
          tenant_id,
          guest_id: guestId,
          guest_name: reservationData.guest_name,
          guest_email: reservationData.guest_email,
          guest_phone: reservationData.guest_phone,
          room_type_id: reservationData.room_type_id, // Soft hold - no specific room yet
          room_id: null, // Will be assigned later
          check_in_date: reservationData.check_in_date,
          check_out_date: reservationData.check_out_date,
          adults: reservationData.adults,
          children: reservationData.children,
          room_rate: reservationData.room_rate,
          total_amount: totalAmount,
          reservation_number: reservationNumber,
          status: reservationData.payment_method === 'prepaid' ? 'confirmed' : 'soft_hold',
          booking_source: reservationData.booking_source,
          is_soft_hold: reservationData.payment_method !== 'prepaid',
          expires_at: expiresAt?.toISOString(),
          payment_deadline: paymentDeadline?.toISOString(),
          verification_deadline: verificationDeadline?.toISOString(),
          requires_verification: reservationData.requires_verification || false,
          grace_period_hours: cancelPolicy?.no_show_grace_hours || 3,
          special_requests: reservationData.special_requests
        })
        .select()
        .single();

      if (error) throw error;

      // Update room type counts
      await supabase.rpc('update_room_type_counts', {
        p_tenant_id: tenant_id,
        p_room_type_id: reservationData.room_type_id
      });

      // Log reservation creation
      await supabase
        .from('reservation_status_log')
        .insert({
          tenant_id,
          reservation_id: reservation.id,
          old_status: null,
          new_status: reservation.status,
          changed_by: user.id,
          change_reason: 'Initial reservation creation',
          metadata: {
            booking_source: reservationData.booking_source,
            payment_method: reservationData.payment_method,
            is_soft_hold: reservation.is_soft_hold
          }
        });

      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast({
        title: "Success",
        description: "Reservation created successfully with soft hold"
      });
    },
    onError: (error) => {
      console.error('Soft hold reservation creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation",
        variant: "destructive"
      });
    }
  });
};

// Hook for hard assignment (room assignment during check-in)
export const useHardAssignReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentData: HardAssignmentData) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const tenant_id = user.user_metadata?.tenant_id;
      if (!tenant_id) throw new Error('No tenant ID found');

      // Verify room is available and clean
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', assignmentData.room_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (roomError || !room) throw new Error('Room not found');
      if (room.status !== 'available') throw new Error(`Room ${room.room_number} is not available (Status: ${room.status})`);

      // Get reservation details
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', assignmentData.reservation_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (reservationError || !reservation) throw new Error('Reservation not found');
      if (!['soft_hold', 'confirmed'].includes(reservation.status)) {
        throw new Error(`Cannot assign room to reservation with status: ${reservation.status}`);
      }

      // Check if room type matches
      if (room.room_type_id !== reservation.room_type_id) {
        throw new Error(`Room type mismatch: Room is ${room.room_type_id}, reservation is for ${reservation.room_type_id}`);
      }

      // Step 1: Get all reservations for this room to find folios to close
      const { data: roomReservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', assignmentData.room_id);

      const reservationIds = roomReservations?.map(r => r.id) || [];

      // Close any existing open folios for this room
      if (reservationIds.length > 0) {
        const { data: existingFolios } = await supabase
          .from('folios')
          .select('id, reservation_id')
          .eq('status', 'open')
          .in('reservation_id', reservationIds);

        if (existingFolios && existingFolios.length > 0) {
          await supabase
            .from('folios')
            .update({ 
              status: 'closed',
              closed_at: new Date().toISOString(),
              closed_by: user.id 
            })
            .in('id', existingFolios.map(f => f.id));
        }
      }

      // Step 2: Update reservation with hard assignment
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          room_id: assignmentData.room_id,
          status: 'hard_assigned',
          is_soft_hold: false,
          room_assignment_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentData.reservation_id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Step 3: Create new folio for the new reservation
      const folioNumber = `FOL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const { data: newFolio, error: folioError } = await supabase
        .from('folios')
        .insert({
          tenant_id,
          reservation_id: assignmentData.reservation_id,
          folio_number: folioNumber,
          status: 'open'
        })
        .select()
        .single();

      if (folioError) throw folioError;

      // Step 4: Add initial room charges based on reservation
      const nights = Math.ceil((new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = reservation.room_rate * nights;

      await supabase
        .from('folio_charges')
        .insert({
          tenant_id,
          folio_id: newFolio.id,
          charge_type: 'room',
          description: `Room charges for ${nights} night(s) at ${room.room_number}`,
          amount: totalAmount,
          posted_by: user.id
        });

      // Step 5: Update room status to reserved (not occupied - that happens at check-in)
      await supabase
        .from('rooms')
        .update({
          status: 'reserved',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentData.room_id);

      // Log the hard assignment
      await supabase
        .from('reservation_status_log')
        .insert({
          tenant_id,
          reservation_id: assignmentData.reservation_id,
          old_status: reservation.status,
          new_status: 'hard_assigned',
          changed_by: user.id,
          change_reason: assignmentData.assignment_reason || 'Room assigned during check-in',
          metadata: {
            room_id: assignmentData.room_id,
            room_number: room.room_number,
            assigned_by_name: user.user_metadata?.name || user.email
          }
        });

      // Update room type counts
      await supabase.rpc('update_room_type_counts', {
        p_tenant_id: tenant_id,
        p_room_type_id: room.room_type_id
      });

      return updatedReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Room assigned successfully"
      });
    },
    onError: (error) => {
      console.error('Room assignment error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign room",
        variant: "destructive"
      });
    }
  });
};

// Hook to get available rooms for assignment
export const useAvailableRoomsForAssignment = (roomTypeId: string, checkInDate: string, checkOutDate: string) => {
  return useQuery({
    queryKey: ['available-rooms-assignment', roomTypeId, checkInDate, checkOutDate],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const tenant_id = user.user_metadata?.tenant_id;
      if (!tenant_id) throw new Error('No tenant ID found');

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types:room_type_id (name, base_rate)
        `)
        .eq('tenant_id', tenant_id)
        .eq('room_type_id', roomTypeId)
        .eq('status', 'available')
        .order('room_number');

      if (error) throw error;

      // Filter out rooms that have conflicting reservations
      const availableRooms = [];
      for (const room of data || []) {
        const { data: conflicts } = await supabase
          .rpc('check_room_availability', {
            p_tenant_id: tenant_id,
            p_room_id: room.id,
            p_check_in_date: checkInDate,
            p_check_out_date: checkOutDate
          });

        if (conflicts) {
          availableRooms.push(room);
        }
      }

      return availableRooms;
    },
    enabled: !!roomTypeId && !!checkInDate && !!checkOutDate
  });
};

// Hook to get room type inventory status
export const useRoomTypeInventory = (tenantId?: string) => {
  return useQuery({
    queryKey: ['room-type-inventory', tenantId],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const tenant_id = tenantId || user.user_metadata?.tenant_id;
      if (!tenant_id) throw new Error('No tenant ID found');

      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('name');

      if (error) throw error;
      return data as RoomType[];
    }
  });
};