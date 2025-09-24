import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface AvailableRoom {
  room_id: string;
  room_number: string;
  room_type_name: string;
  base_rate: number;
  available_rate: number;
  max_occupancy: number;
  is_available: boolean;
}

export interface PricePreview {
  room_id: string;
  room_number: string;
  base_rate: number;
  final_rate: number;
  nights: number;
  subtotal: number;
  taxes: number;
  total: number;
  rate_plan_applied?: string;
}

export function useAvailabilityEngine() {
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailability = useCallback(async (
    checkInDate: string,
    checkOutDate: string,
    roomTypeId?: string
  ): Promise<AvailableRoom[]> => {
    if (!tenant?.tenant_id) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('fn_get_availability', {
        p_tenant_id: tenant.tenant_id,
        p_check_in_date: checkInDate,
        p_check_out_date: checkOutDate,
        p_room_type_id: roomTypeId || null
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to get availability');
      return [];
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenant_id]);

  const getRealtimeAvailability = useCallback(async (
    checkInDate: string,
    checkOutDate: string,
    roomIds?: string[]
  ): Promise<AvailableRoom[]> => {
    if (!tenant?.tenant_id) return [];

    try {
      // Get all availability first
      const allRooms = await getAvailability(checkInDate, checkOutDate);
      
      // Filter by specific room IDs if provided
      if (roomIds?.length) {
        return allRooms.filter(room => roomIds.includes(room.room_id));
      }
      
      return allRooms;
    } catch (err) {
      console.error('Error getting realtime availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to get realtime availability');
      return [];
    }
  }, [getAvailability]);

  const calculatePricePreview = useCallback(async (
    roomId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<PricePreview | null> => {
    if (!tenant?.tenant_id) return null;

    try {
      // Get room availability with pricing
      const availability = await getAvailability(checkInDate, checkOutDate);
      const room = availability.find(r => r.room_id === roomId);
      
      if (!room || !room.is_available) {
        throw new Error('Room is not available for selected dates');
      }

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const subtotal = room.available_rate * nights;
      const taxes = subtotal * 0.075; // 7.5% VAT
      const total = subtotal + taxes;

      return {
        room_id: roomId,
        room_number: room.room_number,
        base_rate: room.base_rate,
        final_rate: room.available_rate,
        nights,
        subtotal,
        taxes,
        total,
        rate_plan_applied: room.available_rate !== room.base_rate ? 'Special Rate Applied' : undefined
      };
    } catch (err) {
      console.error('Error calculating price preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate price');
      return null;
    }
  }, [getAvailability, tenant?.tenant_id]);

  const lockRoomForReservation = useCallback(async (
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    timeoutMinutes: number = 15
  ): Promise<{ success: boolean; lockId?: string }> => {
    if (!tenant?.tenant_id) return { success: false };

    try {
      // Create a temporary reservation with 'pending' status to lock the room
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          tenant_id: tenant.tenant_id,
          room_id: roomId,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          status: 'pending',
          guest_name: 'TEMP_LOCK',
          guest_email: 'temp@lock.com',
          room_rate: 0,
          total_amount: 0,
          reservation_number: 'LOCK_' + Date.now(),
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      // Set a timeout to release the lock
      setTimeout(async () => {
        await supabase
          .from('reservations')
          .delete()
          .eq('id', data.id)
          .eq('status', 'pending');
      }, timeoutMinutes * 60 * 1000);

      return { success: true, lockId: data.id };
    } catch (err) {
      console.error('Error locking room:', err);
      return { success: false };
    }
  }, [tenant?.tenant_id]);

  const releaseLock = useCallback(async (lockId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', lockId)
        .eq('status', 'pending');

      return !error;
    } catch (err) {
      console.error('Error releasing lock:', err);
      return false;
    }
  }, []);

  return {
    getAvailability,
    getRealtimeAvailability,
    calculatePricePreview,
    lockRoomForReservation,
    releaseLock,
    loading,
    error
  };
}