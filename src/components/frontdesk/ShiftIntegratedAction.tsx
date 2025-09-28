import { useActiveShiftSessions } from "@/hooks/useShiftSessions";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { useToast } from "@/hooks/use-toast";

interface ShiftIntegratedActionProps {
  action: string;
  roomNumber: string;
  guestName?: string;
  amount?: number;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

interface ShiftActionLog {
  timestamp: string;
  action: string;
  room_number: string;
  guest_name?: string;
  amount?: number;
  payment_method?: string;
  actor_id: string;
  shift_id?: string;
  device_id: string;
  metadata?: Record<string, any>;
}

export const useShiftIntegratedAction = () => {
  const { data: activeShifts } = useActiveShiftSessions();
  const { user } = useAuth();
  const { toast } = useToast();

  const logShiftAction = async ({
    action,
    roomNumber,
    guestName,
    amount,
    paymentMethod,
    metadata = {}
  }: ShiftIntegratedActionProps): Promise<boolean> => {
    try {
      const currentShift = activeShifts?.[0]; // Get current active shift
      const deviceId = localStorage.getItem('device_id') || 'FD-TERMINAL-1';
      
      const actionLog: ShiftActionLog = {
        timestamp: new Date().toISOString(),
        action,
        room_number: roomNumber,
        guest_name: guestName,
        amount,
        payment_method: paymentMethod,
        actor_id: user?.id || 'unknown',
        shift_id: currentShift?.id,
        device_id: deviceId,
        metadata: {
          ...metadata,
          tenant_id: user?.tenant_id,
          browser_info: navigator.userAgent,
        }
      };

      // Log to console for now (in production, this would go to audit_log table)
      console.log('SHIFT ACTION LOG:', actionLog);
      
      // Store in localStorage for shift reports
      const existingLogs = JSON.parse(localStorage.getItem('shift_actions') || '[]');
      existingLogs.push(actionLog);
      localStorage.setItem('shift_actions', JSON.stringify(existingLogs));

      // Show warning if no active shift
      if (!currentShift) {
        toast({
          title: "No Active Shift",
          description: "Action completed but not linked to a shift session. Please start your shift.",
          variant: "destructive",
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to log shift action:', error);
      return false;
    }
  };

  const getCurrentShiftInfo = () => {
    const currentShift = activeShifts?.[0];
    const deviceId = localStorage.getItem('device_id') || 'FD-TERMINAL-1';
    
    return {
      shiftId: currentShift?.id,
      actorId: user?.id,
      deviceId,
      hasActiveShift: !!currentShift,
    };
  };

  return {
    logShiftAction,
    getCurrentShiftInfo,
    hasActiveShift: !!activeShifts?.[0],
  };
};