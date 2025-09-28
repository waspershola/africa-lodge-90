import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface RoomStatusAuditLog {
  id: string;
  action: string;
  resource_id: string;
  description: string;
  old_values?: { status?: string };
  new_values?: { status?: string };
  metadata?: {
    room_number?: string;
    reservation_id?: string;
    trigger?: string;
    old_room_status?: string;
    new_room_status?: string;
  };
  created_at: string;
  actor_id?: string;
}

export interface RoomStatusInconsistency {
  room_id: string;
  room_number: string;
  room_status: string;
  active_reservations: number;
  expected_status: string;
  inconsistent: boolean;
}

/**
 * Hook to monitor room status changes and detect inconsistencies
 * Useful for debugging and ensuring the automatic status management is working correctly
 */
export const useRoomStatusMonitoring = () => {
  const { tenant } = useAuth();

  // Query recent room status changes from audit log
  const { data: recentStatusChanges, isLoading: isLoadingAuditLog } = useQuery({
    queryKey: ['room-status-audit', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .in('action', ['ROOM_STATUS_CHANGED', 'ROOM_STATUS_AUTO_UPDATE'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as RoomStatusAuditLog[];
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Query to detect room status inconsistencies
  const { data: statusInconsistencies, isLoading: isLoadingInconsistencies } = useQuery({
    queryKey: ['room-status-validation', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      // Manual validation query to detect room status inconsistencies
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          status,
          reservations:reservations(id, status)
        `)
        .eq('tenant_id', tenant.tenant_id);

      if (roomsError) throw roomsError;

      return rooms?.map(room => {
        const activeReservations = room.reservations?.filter(
          (r: any) => r.status === 'confirmed' || r.status === 'checked_in'
        ).length || 0;

        let expectedStatus = room.status;
        let inconsistent = false;

        // Basic validation rules
        if (activeReservations === 0 && room.status === 'occupied') {
          expectedStatus = 'available';
          inconsistent = true;
        } else if (activeReservations > 0 && room.status === 'available') {
          expectedStatus = 'reserved';
          inconsistent = true;
        }

        return {
          room_id: room.id,
          room_number: room.room_number,
          room_status: room.status,
          active_reservations: activeReservations,
          expected_status: expectedStatus,
          inconsistent
        } as RoomStatusInconsistency;
      }) || [];
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 60000 // Check for inconsistencies every minute
  });

  // Get summary statistics
  const statusChangesSummary = {
    totalChanges: recentStatusChanges?.length || 0,
    automaticChanges: recentStatusChanges?.filter(log => 
      log.action === 'ROOM_STATUS_AUTO_UPDATE'
    ).length || 0,
    manualChanges: recentStatusChanges?.filter(log => 
      log.action === 'ROOM_STATUS_CHANGED'
    ).length || 0,
    cancellationTriggered: recentStatusChanges?.filter(log => 
      log.metadata?.trigger === 'reservation_cancelled'
    ).length || 0
  };

  const inconsistenciesSummary = {
    totalInconsistencies: statusInconsistencies?.filter(item => item.inconsistent).length || 0,
    totalRooms: statusInconsistencies?.length || 0,
    consistencyRate: statusInconsistencies?.length ? 
      ((statusInconsistencies.length - statusInconsistencies.filter(item => item.inconsistent).length) / statusInconsistencies.length * 100).toFixed(1) : '100'
  };

  return {
    // Audit data
    recentStatusChanges,
    isLoadingAuditLog,
    
    // Validation data
    statusInconsistencies,
    isLoadingInconsistencies,
    
    // Summary statistics
    statusChangesSummary,
    inconsistenciesSummary,
    
    // Helper functions
    hasInconsistencies: () => (statusInconsistencies?.filter(item => item.inconsistent).length || 0) > 0,
    getInconsistentRooms: () => statusInconsistencies?.filter(item => item.inconsistent) || [],
    getRecentCancellations: () => recentStatusChanges?.filter(log => 
      log.metadata?.trigger === 'reservation_cancelled'
    ) || []
  };
};

/**
 * Hook to get room status history for a specific room
 */
export const useRoomStatusHistory = (roomId?: string) => {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['room-status-history', roomId, tenant?.tenant_id],
    queryFn: async () => {
      if (!roomId || !tenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('resource_id', roomId)
        .in('action', ['ROOM_STATUS_CHANGED', 'ROOM_STATUS_AUTO_UPDATE'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as RoomStatusAuditLog[];
    },
    enabled: !!roomId && !!tenant?.tenant_id
  });
};