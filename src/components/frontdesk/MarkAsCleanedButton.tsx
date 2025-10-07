import { useState } from "react";
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

  // Check if user has permission to mark rooms as cleaned
  const canMarkAsCleaned = user?.role && [
    'HOUSEKEEPING', 
    'FRONT_DESK', 
    'MANAGER', 
    'OWNER'
  ].includes(user.role);

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

    // Store previous room data for rollback
    const previousRoomData = { ...room };
    
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
      
      // Update the room object if callback provided
      if (onRoomUpdate) {
        const updatedRoom: Room = {
          ...room,
          status: 'available' as const
        };
        onRoomUpdate(updatedRoom);
      }

      // Wait for query invalidation to complete
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
        queryClient.invalidateQueries({ queryKey: ['room-availability'] }),
      ]);

      toast({
        title: "Room Cleaned",
        description: `Room ${room.number} has been marked as cleaned and is now available.`,
      });

      onComplete?.();
    } catch (error) {
      console.error('Mark as cleaned error:', error);
      
      // ROLLBACK: Restore room data if callback provided
      if (onRoomUpdate) {
        onRoomUpdate(previousRoomData);
      }
      
      toast({
        title: "Error",
        description: `Failed to mark room as cleaned: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Only show for dirty rooms
  if (room.status !== 'dirty') {
    return null;
  }

  return (
    <Button
      onClick={handleMarkAsCleaned}
      disabled={!canMarkAsCleaned || isLoading || isProcessing}
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