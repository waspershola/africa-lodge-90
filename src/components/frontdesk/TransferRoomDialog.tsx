import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Bed, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShiftIntegratedAction } from "./ShiftIntegratedAction";
import { useReceiptPrinter } from "@/hooks/useReceiptPrinter";
import type { Room } from "./RoomGrid";

interface TransferRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceRoom: Room | null;
  availableRooms: Room[];
  onComplete?: (sourceRoom: Room, targetRoom: Room) => void;
}

export const TransferRoomDialog = ({
  open,
  onOpenChange,
  sourceRoom,
  availableRooms,
  onComplete,
}: TransferRoomDialogProps) => {
  const [selectedTargetRoom, setSelectedTargetRoom] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferFee, setTransferFee] = useState(0);
  const { toast } = useToast();
  const { logShiftAction } = useShiftIntegratedAction();
  const { printServiceReceipt } = useReceiptPrinter();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTargetRoom("");
      setTransferFee(0);
    }
  }, [open]);

  // Calculate transfer fee based on room rate difference
  useEffect(() => {
    if (selectedTargetRoom && sourceRoom) {
      const targetRoom = availableRooms.find(r => r.id === selectedTargetRoom);
      if (targetRoom) {
        const rateDifference = (targetRoom.room_type?.base_rate || 0) - (sourceRoom.room_type?.base_rate || 0);
        setTransferFee(Math.max(0, rateDifference));
      }
    }
  }, [selectedTargetRoom, sourceRoom, availableRooms]);

  const handleTransfer = async () => {
    if (!sourceRoom || !selectedTargetRoom) return;

    const targetRoom = availableRooms.find(r => r.id === selectedTargetRoom);
    if (!targetRoom) return;

    setIsProcessing(true);

    try {
      // Real backend integration for room transfer
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Get current reservation for source room
      const { data: currentReservation, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('room_id', sourceRoom.id)
        .eq('status', 'checked_in')
        .single();

      if (reservationError) throw new Error('No active reservation found');

      // Start transaction: Update reservation to new room
      const { error: updateReservationError } = await supabase
        .from('reservations')
        .update({ 
          room_id: targetRoom.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentReservation.id);

      if (updateReservationError) throw updateReservationError;

      // Update source room status to available
      const { error: sourceRoomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceRoom.id);

      if (sourceRoomError) throw sourceRoomError;

      // Update target room status to occupied
      const { error: targetRoomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'occupied',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetRoom.id);

      if (targetRoomError) throw targetRoomError;

      // Add transfer fee charge if applicable
      if (transferFee > 0) {
        // Use safe folio handler to get folio for this reservation
        const { data: folioId, error: folioIdError } = await supabase
          .rpc('handle_multiple_folios', {
            p_reservation_id: currentReservation.id
          });

        if (!folioIdError && folioId) {
          const { error: chargeError } = await supabase
            .from('folio_charges')
            .insert({
              folio_id: folioId,
              charge_type: 'service',
              description: `Room transfer fee: ${sourceRoom.number} → ${targetRoom.number}`,
              amount: transferFee,
              tenant_id: user.user_metadata?.tenant_id
            });

          if (chargeError) console.warn('Failed to add transfer fee charge:', chargeError);
        }
      }

      // Log shift action
      await logShiftAction({
        action: 'Room Transfer',
        roomNumber: `${sourceRoom.number} → ${targetRoom.number}`,
        guestName: sourceRoom.guest || 'Guest',
        amount: transferFee,
        metadata: {
          source_room: sourceRoom.number,
          target_room: targetRoom.number,
          transfer_fee: transferFee,
          reason: 'Guest requested room change',
          reservation_id: currentReservation.id
        }
      });

      // Print receipt if there's a fee
      if (transferFee > 0) {
        await printServiceReceipt({
          guestName: sourceRoom.guest || 'Guest',
          roomNumber: `${sourceRoom.number} → ${targetRoom.number}`,
          items: [{
            description: 'Room Transfer Fee',
            quantity: 1,
            unitPrice: transferFee,
            total: transferFee
          }],
          paymentMethod: 'Cash',
          subtotal: transferFee,
          totalAmount: transferFee,
          amountPaid: transferFee,
          notes: `Room transfer from ${sourceRoom.number} to ${targetRoom.number}`
        });
      }

      toast({
        title: "Room Transfer Completed",
        description: `Guest moved from Room ${sourceRoom.number} to Room ${targetRoom.number}${transferFee > 0 ? ` with ₦${transferFee.toLocaleString()} transfer fee` : ''}.`,
      });

      onComplete?.(sourceRoom, targetRoom);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "Failed to complete room transfer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const targetRoom = availableRooms.find(r => r.id === selectedTargetRoom);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Transfer Guest to Another Room
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Room Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Current Room</div>
                  <div className="text-lg font-bold">Room {sourceRoom?.number}</div>
                  <div className="text-sm text-muted-foreground">{sourceRoom?.guest}</div>
                </div>
                <Badge variant="destructive">Occupied</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Target Room Selection */}
          <div className="space-y-3">
            <Label htmlFor="target-room">Select Target Room</Label>
            <Select value={selectedTargetRoom} onValueChange={setSelectedTargetRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Choose available room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        <span>Room {room.number}</span>
                        <Badge variant="secondary">{room.type}</Badge>
                      </div>
                      <span className="ml-4 text-sm text-muted-foreground">
                        ₦{room.room_type?.base_rate?.toLocaleString() || '0'}/night
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Preview */}
          {targetRoom && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium">Transfer Preview</div>
                  {transferFee > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Additional Fee Required
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">From</div>
                    <div className="font-medium">Room {sourceRoom?.number}</div>
                    <div className="text-xs text-muted-foreground">
                      ₦{sourceRoom?.room_type?.base_rate?.toLocaleString() || '0'}/night
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground">To</div>
                    <div className="font-medium">Room {targetRoom.number}</div>
                    <div className="text-xs text-muted-foreground">
                      ₦{targetRoom.room_type?.base_rate?.toLocaleString() || '0'}/night
                    </div>
                  </div>
                </div>

                {transferFee > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Transfer Fee:</span>
                      <span className="font-bold text-orange-600">
                        ₦{transferFee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedTargetRoom || isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Processing..." : "Complete Transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};