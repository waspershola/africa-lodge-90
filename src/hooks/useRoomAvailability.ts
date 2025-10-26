import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface AvailableRoom {
  room_id: string;
  room_number: string;
  room_type_name: string;
  base_rate: number;
  max_occupancy: number;
}

export function useRoomAvailability() {
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRoomAvailability = async (
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: string
  ): Promise<boolean> => {
    if (!tenant?.tenant_id) return false;

    try {
      const { data, error } = await supabase.rpc('check_room_availability', {
        p_tenant_id: tenant.tenant_id,
        p_room_id: roomId,
        p_check_in_date: checkInDate,
        p_check_out_date: checkOutDate,
        p_exclude_reservation_id: excludeReservationId || null
      });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Error checking room availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to check availability');
      return false;
    }
  };

  const getAvailableRooms = async (
    checkInDate: string,
    checkOutDate: string,
    roomTypeId?: string
  ): Promise<AvailableRoom[]> => {
    if (!tenant?.tenant_id) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_available_rooms', {
        p_tenant_id: tenant.tenant_id,
        p_check_in_date: checkInDate,
        p_check_out_date: checkOutDate,
        p_room_type_id: roomTypeId || null
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting available rooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to get available rooms');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyRate = async (startDate: string, endDate: string) => {
    if (!tenant?.tenant_id) return 0;

    try {
      // Get total rooms
      const { count: totalRooms, error: roomError } = await supabase
        .from('rooms')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .neq('status', 'out_of_order');

      if (roomError) throw roomError;

      // Get occupied room nights
      const { data: dailyRevenue, error: revenueError } = await supabase
        .rpc('fn_daily_revenue', {
          tenant_uuid: tenant.tenant_id,
          start_date: startDate,
          end_date: endDate
        });

      if (revenueError) throw revenueError;

      if (!totalRooms || !dailyRevenue?.length) return 0;

      const totalOccupiedNights = dailyRevenue.reduce((sum, day) => sum + day.occupied_rooms, 0);
      const totalAvailableNights = totalRooms * dailyRevenue.length;

      return totalAvailableNights > 0 ? (totalOccupiedNights / totalAvailableNights) * 100 : 0;
    } catch (err) {
      console.error('Error calculating occupancy rate:', err);
      return 0;
    }
  };

  return {
    checkRoomAvailability,
    getAvailableRooms,
    getOccupancyRate,
    loading,
    error
  };
}