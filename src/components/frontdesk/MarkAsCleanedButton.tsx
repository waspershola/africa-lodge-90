import { useState, useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRoomStatusManager } from "@/hooks/useRoomStatusManager";
import { useAuth } from "@/hooks/useAuth";
import type { Room } from "./RoomGrid";

interface MarkAsCleanedButtonProps {
  room: Room;
  onRoomUpdate?: (updatedRoom: Room) => void;
  onComplete?: () => void;
}

export const MarkAsCleanedButton = ({ 
  room, 
  onRoomUpdate, 
  onComplete 
}: MarkAsCleanedButtonProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateRoomStatusAsync, isLoading } = useRoomStatusManager();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  // Check if user has permission to mark rooms as cleaned
  const canMarkAsCleaned = user?.role && [
    'HOUSEKEEPING', 
    'FRONT_DESK', 
    'MANAGER', 
    'OWNER'
  ].includes(user.role);

  // REAL-TIME UPDATE FIX: Monitor room status changes and update button visibility
  useEffect(() => {
    const shouldShowButton = room.status === 'dirty' && canMarkAsCleaned;
    setButtonVisible(shouldShowButton);
  }, [room.status, canMarkAsCleaned]);

  const handleMarkAsCleaned = async () => {
    if (!canMarkAsCleaned) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to mark rooms as cleaned.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Transition from dirty to clean
      await updateRoomStatusAsync({
        roomId: room.id,
        newStatus: 'clean',
        reason: 'Room cleaning completed',
        metadata: {
          cleaned_by: user.email,
          cleaned_at: new Date().toISOString(),
          previous_status: room.status
        }
      });

      // Step 2: Transition from clean to available
      await updateRoomStatusAsync({
        roomId: room.id,
        newStatus: 'available',
        reason: 'Room ready for guests',
        metadata: {
          made_available_by: user.email,
          made_available_at: new Date().toISOString(),
          previous_status: 'clean'
        }
      });

      // REAL-TIME UPDATE FIX: Trigger optimistic UI update immediately
      setButtonVisible(false);
      
      // Update the room object if callback provided
      if (onRoomUpdate) {
        const updatedRoom: Room = {
          ...room,
          status: 'available' as const
        };
        onRoomUpdate(updatedRoom);
      }

      // REAL-TIME UPDATE FIX: Invalidate queries to trigger UI refresh
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });

      toast({
        title: "Room Cleaned",
        description: `Room ${room.number} has been marked as cleaned and is now available.`,
      });

      onComplete?.();
    } catch (error) {
      console.error('Mark as cleaned error:', error);
      // REAL-TIME UPDATE FIX: Restore button visibility on error
      setButtonVisible(room.status === 'dirty' && canMarkAsCleaned);
      toast({
        title: "Error",
        description: `Failed to mark room as cleaned: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // REAL-TIME UPDATE FIX: Use state-based visibility instead of prop-based
  if (!buttonVisible) {
    return null;
  }

  return (
    <Button
      onClick={handleMarkAsCleaned}
      disabled={isLoading || isProcessing}
      className="bg-room-available text-room-available-foreground hover:bg-room-available/90"
      size="sm"
    >
      {(isLoading || isProcessing) ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      Mark as Cleaned
    </Button>
  );
};