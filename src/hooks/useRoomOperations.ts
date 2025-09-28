import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Real room assignment hook
export const useAssignRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reservationId, roomId }: { reservationId: string; roomId: string }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Update the reservation with room assignment
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .update({ 
          room_id: roomId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Update room status to reserved
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'occupied',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (roomError) throw roomError;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'room_assigned',
          resource_type: 'reservation',
          resource_id: reservationId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.user_metadata?.role,
          tenant_id: user.user_metadata?.tenant_id,
          description: `Room assigned to reservation ${reservation.reservation_number}`,
          metadata: { room_id: roomId }
        }]);

      return { reservation, roomId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
      toast({
        title: "Success",
        description: "Room assigned successfully"
      });
    },
    onError: (error: any) => {
      console.error('Room assignment error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to assign room",
        variant: "destructive"
      });
    }
  });
};

// Real check-in hook
export const useCheckInGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get the reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('*, rooms:room_id(*)')
        .eq('id', reservationId)
        .single();

      if (reservationError) throw reservationError;
      if (reservation.status !== 'confirmed') {
        throw new Error('Only confirmed reservations can be checked in');
      }

      // Update reservation status to checked in
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update room status to occupied
      if (reservation.room_id) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ 
            status: 'occupied',
            updated_at: new Date().toISOString()
          })
          .eq('id', reservation.room_id);

        if (roomError) throw roomError;
      }

      // Create or get folio for the reservation
      const { data: folios, error: folioError } = await supabase
        .from('folios')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('status', 'open');

      if (folioError) throw folioError;

      if (!folios || folios.length === 0) {
        // Create folio if it doesn't exist
        const { error: createFolioError } = await supabase
          .from('folios')
          .insert({
            tenant_id: user.user_metadata?.tenant_id,
            reservation_id: reservationId,
            folio_number: `FOL-${reservation.reservation_number}`,
            status: 'open'
          });

        if (createFolioError) throw createFolioError;
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
          actor_role: user.user_metadata?.role,
          tenant_id: user.user_metadata?.tenant_id,
          description: `Guest checked in: ${reservation.guest_name}`,
          metadata: { room_id: reservation.room_id }
        }]);

      return updatedReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['folios'] });
      toast({
        title: "Success",
        description: "Guest checked in successfully"
      });
    },
    onError: (error: any) => {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to check in guest",
        variant: "destructive"
      });
    }
  });
};

// Real check-out hook
export const useCheckOutGuest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get the reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('*, rooms:room_id(*)')
        .eq('id', reservationId)
        .single();

      if (reservationError) throw reservationError;
      if (reservation.status !== 'checked_in') {
        throw new Error('Only checked-in guests can be checked out');
      }

      // Close any open folios
      const { error: folioError } = await supabase
        .from('folios')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: user.id
        })
        .eq('reservation_id', reservationId)
        .eq('status', 'open');

      if (folioError) throw folioError;

      // Update reservation status to checked out
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'checked_out',
          checked_out_at: new Date().toISOString(),
          checked_out_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update room status to dirty (needs cleaning)
      if (reservation.room_id) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ 
            status: 'dirty',
            updated_at: new Date().toISOString()
          })
          .eq('id', reservation.room_id);

        if (roomError) throw roomError;
      }

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'guest_checked_out',
          resource_type: 'reservation',
          resource_id: reservationId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.user_metadata?.role,
          tenant_id: user.user_metadata?.tenant_id,
          description: `Guest checked out: ${reservation.guest_name}`,
          metadata: { room_id: reservation.room_id }
        }]);

      return updatedReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['folios'] });
      toast({
        title: "Success",
        description: "Guest checked out successfully"
      });
    },
    onError: (error: any) => {
      console.error('Check-out error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to check out guest",
        variant: "destructive"
      });
    }
  });
};

// Real room conflict checker
export const useCheckRoomConflicts = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roomId, checkInDate, checkOutDate, excludeReservationId }: {
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      excludeReservationId?: string;
    }) => {
      let query = supabase
        .from('reservations')
        .select('id, guest_name, check_in_date, check_out_date, status')
        .eq('room_id', roomId)
        .in('status', ['confirmed', 'checked_in'])
        .or(`and(check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate})`);

      if (excludeReservationId) {
        query = query.neq('id', excludeReservationId);
      }

      const { data: conflicts, error } = await query;

      if (error) throw error;

      const hasConflicts = (conflicts?.length || 0) > 0;

      if (hasConflicts) {
        toast({
          title: "Room Conflict Detected",
          description: `Room has ${conflicts?.length} conflicting reservation(s)`,
          variant: "destructive"
        });
      }

      return {
        hasConflicts,
        conflicts: conflicts || [],
        conflictCount: conflicts?.length || 0
      };
    },
    onError: (error: any) => {
      console.error('Conflict check error:', error);
      toast({
        title: "Error",
        description: "Failed to check room conflicts",
        variant: "destructive"
      });
    }
  });
};

// Staff management hooks
export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (staffData: any) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Use the invite-user edge function
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          ...staffData,
          tenant_id: user.user_metadata?.tenant_id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "Staff member created successfully"
      });
    },
    onError: (error: any) => {
      console.error('Staff creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create staff member",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "Staff member updated successfully"
      });
    },
    onError: (error: any) => {
      console.error('Staff update error:', error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive"
      });
    }
  });
};

export const useDeleteStaffMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "Staff member removed successfully"
      });
    },
    onError: (error: any) => {
      console.error('Staff deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      });
    }
  });
};

export const useInviteStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inviteData: any) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          ...inviteData,
          tenant_id: user.user_metadata?.tenant_id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Success",
        description: "Staff invitation sent successfully"
      });
    },
    onError: (error: any) => {
      console.error('Staff invitation error:', error);
      toast({
        title: "Error",
        description: "Failed to send staff invitation",
        variant: "destructive"
      });
    }
  });
};