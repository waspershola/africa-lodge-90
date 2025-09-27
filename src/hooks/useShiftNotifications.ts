import { useMutation } from '@tanstack/react-query';
import { useCreateServiceAlert } from './useNotificationScheduler';
import { useAuditLog } from './useAuditLog';
import { useAudioNotifications } from './useAudioNotifications';

interface ShiftNotificationData {
  shiftId: string;
  staffName: string;
  role: string;
  deviceSlug?: string;
  cashTotal?: number;
  posTotal?: number;
  handoverNotes?: string;
  unresolvedItems?: string[];
  shiftDuration?: number;
}

export const useShiftNotifications = () => {
  const createServiceAlert = useCreateServiceAlert();
  const { logEvent } = useAuditLog();
  const { notifyShiftStart: audioShiftStart, notifyShiftEnd: audioShiftEnd, notifyHandoverRequired: audioHandover } = useAudioNotifications();

  const notifyShiftStart = useMutation({
    mutationFn: async (data: ShiftNotificationData) => {
      // Create staff notification for shift start
      await createServiceAlert.mutateAsync({
        sourceId: data.shiftId,
        sourceType: 'maintenance', // Using existing type for staff operations
        title: `Shift Started: ${data.role}`,
        description: `${data.staffName} has started their ${data.role} shift${data.deviceSlug ? ` on device ${data.deviceSlug}` : ''}`,
        priority: 'medium',
        department: 'FRONT_DESK'
      });

      // Play audio notification
      audioShiftStart(data.staffName, data.role);

      // Log audit event
      await logEvent({
        action: 'SHIFT_STARTED',
        resource_type: 'SHIFT_SESSION',
        resource_id: data.shiftId,
        description: `Shift started for ${data.role}`,
        metadata: {
          staff_name: data.staffName,
          role: data.role,
          device_slug: data.deviceSlug,
          start_time: new Date().toISOString()
        }
      });
    }
  });

  const notifyShiftEnd = useMutation({
    mutationFn: async (data: ShiftNotificationData) => {
      const totalCollected = (data.cashTotal || 0) + (data.posTotal || 0);
      
      // Create manager notification for shift end
      await createServiceAlert.mutateAsync({
        sourceId: data.shiftId,
        sourceType: 'maintenance',
        title: `Shift Ended: ${data.role}`,
        description: `${data.staffName} ended their shift. Total collected: $${totalCollected}. ${data.unresolvedItems?.length || 0} unresolved items.`,
        priority: data.unresolvedItems?.length ? 'high' : 'medium',
        department: 'MANAGEMENT'
      });

      // Play audio notification
      audioShiftEnd(data.staffName, data.role, data.unresolvedItems?.length);

      // Log audit event
      await logEvent({
        action: 'SHIFT_ENDED',
        resource_type: 'SHIFT_SESSION',
        resource_id: data.shiftId,
        description: `Shift ended for ${data.role}`,
        metadata: {
          staff_name: data.staffName,
          role: data.role,
          cash_total: data.cashTotal,
          pos_total: data.posTotal,
          total_collected: totalCollected,
          unresolved_items_count: data.unresolvedItems?.length || 0,
          handover_notes: data.handoverNotes,
          duration_hours: data.shiftDuration,
          end_time: new Date().toISOString()
        }
      });
    }
  });

  const notifyHandoverRequired = useMutation({
    mutationFn: async (data: { outgoingStaff: string; incomingStaff: string; unresolvedCount: number }) => {
      await createServiceAlert.mutateAsync({
        sourceId: `handover-${Date.now()}`,
        sourceType: 'maintenance',
        title: 'Handover Required',
        description: `${data.outgoingStaff} needs to hand over ${data.unresolvedCount} unresolved items to ${data.incomingStaff}`,
        priority: 'high',
        department: 'MANAGEMENT'
      });

      // Play audio notification
      audioHandover(data.unresolvedCount);
    }
  });

  return {
    notifyShiftStart,
    notifyShiftEnd,
    notifyHandoverRequired
  };
};