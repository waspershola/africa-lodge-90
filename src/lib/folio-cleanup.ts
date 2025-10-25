// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

/**
 * PHASE 6: Database Cleanup Utility
 * Provides functions to clean up orphaned folios and reset room states
 */

export interface CleanupResult {
  success: boolean;
  closedFolios: number;
  errors: string[];
}

/**
 * Close orphaned folios for checked-out reservations
 * This ensures folios are properly closed when reservations are checked out
 */
export async function cleanupOrphanedFolios(tenantId: string): Promise<CleanupResult> {
  const errors: string[] = [];
  let closedFolios = 0;

  try {
    // Find all checked-out reservations with open folios
    const { data: checkedOutReservations, error: resError } = await supabase
      .from('reservations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'checked_out');

    if (resError) {
      errors.push(`Failed to fetch checked-out reservations: ${resError.message}`);
      return { success: false, closedFolios: 0, errors };
    }

    if (!checkedOutReservations || checkedOutReservations.length === 0) {
      return { success: true, closedFolios: 0, errors: [] };
    }

    const reservationIds = checkedOutReservations.map(r => r.id);

    // Close all open folios for these reservations
    const { data: updatedFolios, error: folioError } = await supabase
      .from('folios')
      .update({ 
        status: 'closed', 
        closed_at: new Date().toISOString() 
      })
      .eq('status', 'open')
      .in('reservation_id', reservationIds)
      .select();

    if (folioError) {
      errors.push(`Failed to close folios: ${folioError.message}`);
      return { success: false, closedFolios: 0, errors };
    }

    closedFolios = updatedFolios?.length || 0;

    return {
      success: true,
      closedFolios,
      errors: []
    };
  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, closedFolios: 0, errors };
  }
}

/**
 * Reset room status to available when no active reservations exist
 * Useful for cleaning up rooms that are stuck in reserved/occupied status
 */
export async function resetRoomStatuses(tenantId: string): Promise<CleanupResult> {
  const errors: string[] = [];
  let updatedRooms = 0;

  try {
    // Find all rooms that are occupied or reserved but have no active reservations
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select(`
        id,
        room_number,
        status,
        reservations!rooms_room_id_fkey(
          id,
          status
        )
      `)
      .eq('tenant_id', tenantId)
      .in('status', ['occupied', 'reserved']);

    if (roomsError) {
      errors.push(`Failed to fetch rooms: ${roomsError.message}`);
      return { success: false, closedFolios: 0, errors };
    }

    const roomsToReset = rooms?.filter((room: any) => {
      const activeReservations = room.reservations?.filter((res: any) => 
        ['checked_in', 'confirmed', 'hard_assigned'].includes(res.status)
      );
      return !activeReservations || activeReservations.length === 0;
    });

    if (!roomsToReset || roomsToReset.length === 0) {
      return { success: true, closedFolios: 0, errors: [] };
    }

    // Reset these rooms to available
    const { data: updatedData, error: updateError } = await supabase
      .from('rooms')
      .update({ status: 'available' })
      .in('id', roomsToReset.map((r: any) => r.id))
      .select();

    if (updateError) {
      errors.push(`Failed to reset room statuses: ${updateError.message}`);
      return { success: false, closedFolios: 0, errors };
    }

    updatedRooms = updatedData?.length || 0;

    return {
      success: true,
      closedFolios: updatedRooms,
      errors: []
    };
  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, closedFolios: 0, errors };
  }
}

/**
 * Comprehensive cleanup: Close orphaned folios AND reset room statuses
 */
export async function performFullCleanup(tenantId: string): Promise<{
  folioCleanup: CleanupResult;
  roomCleanup: CleanupResult;
}> {
  const folioCleanup = await cleanupOrphanedFolios(tenantId);
  const roomCleanup = await resetRoomStatuses(tenantId);

  return {
    folioCleanup,
    roomCleanup
  };
}
