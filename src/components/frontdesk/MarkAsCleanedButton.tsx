import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useRoomStatusManager } from "@/hooks/useRoomStatusManager";
import { useToast } from "@/hooks/use-toast";

interface MarkAsCleanedButtonProps {
  roomId: string;
  roomNumber: string;
  currentStatus: string;
  userRole?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export const MarkAsCleanedButton = ({
  roomId,
  roomNumber,
  currentStatus,
  userRole,
  onSuccess,
  disabled = false
}: MarkAsCleanedButtonProps) => {
  const { updateRoomStatusAsync } = useRoomStatusManager();
  const { toast } = useToast();

  // Check if user has permission to mark rooms as cleaned
  const hasPermission = userRole && ['OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING'].includes(userRole);
  
  // Only show button for dirty rooms
  const shouldShow = currentStatus === 'dirty' && hasPermission;

  if (!shouldShow) return null;

  const handleMarkAsCleaned = async () => {
    try {
      await updateRoomStatusAsync({
        roomId,
        newStatus: 'available'
      });

      toast({
        title: "Room Cleaned",
        description: `Room ${roomNumber} has been marked as cleaned and is now available.`
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to mark room as cleaned:', error);
      toast({
        title: "Error",
        description: "Failed to mark room as cleaned. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={handleMarkAsCleaned}
      disabled={disabled}
      size="sm"
      className="bg-room-available hover:bg-room-available/90 text-room-available-foreground"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Mark as Cleaned
    </Button>
  );
};