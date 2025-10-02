import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Unlock, Calendar, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShiftIntegratedAction } from "./ShiftIntegratedAction";
import type { Room } from "./RoomGrid";

interface ReleaseReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onComplete?: (room: Room) => void;
}

const RELEASE_REASONS = [
  'Guest requested cancellation',
  'No-show after grace period',
  'Payment failed',
  'Overbooking adjustment',
  'Guest upgraded to different room',
  'Force majeure/Emergency',
  'Other'
];

export const ReleaseReservationDialog = ({
  open,
  onOpenChange,
  room,
  onComplete,
}: ReleaseReservationDialogProps) => {
  const [releaseReason, setReleaseReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { logShiftAction } = useShiftIntegratedAction();

  const handleRelease = async () => {
    if (!room || !releaseReason) return;

    setIsProcessing(true);

    try {
      // REAL DB OPERATION: Call atomic cancel_reservation_atomic RPC
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        throw new Error('Tenant ID not found');
      }

      // Get the current reservation for this room
      const currentReservation = (room as any).current_reservation;
      if (!currentReservation?.id) {
        throw new Error('No active reservation found for this room');
      }

      // Call the atomic cancel function with refund amount and notes
      const { data, error } = await supabase.rpc('cancel_reservation_atomic', {
        p_tenant_id: tenantId,
        p_reservation_id: currentReservation.id,
        p_cancelled_by: user.id,
        p_reason: releaseReason || null,
        p_refund_amount: refundAmount > 0 ? refundAmount : null,
        p_notes: notes || null
      });

      if (error) {
        throw error;
      }

      // Phase 3: Enhanced RPC result validation
      const result = Array.isArray(data) ? data[0] : data;
      
      // Verify RPC returned success
      if (!result) {
        throw new Error('No response from cancellation service');
      }
      
      if ((result as any).success !== true) {
        // Show specific error message from RPC
        const errorMsg = (result as any)?.message || 'Failed to cancel reservation';
        toast({
          title: "Cannot Release Room",
          description: errorMsg,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      console.log('[Release] Cancellation successful:', result);

      // Log shift action after successful cancellation
      await logShiftAction({
        action: 'Release Reservation',
        roomNumber: room.number || room.room_number,
        guestName: room.guest,
        amount: refundAmount,
        metadata: {
          release_reason: releaseReason,
          refund_amount: refundAmount,
          notes: notes,
          original_status: room.status,
          reservation_id: currentReservation.id
        }
      });

      toast({
        title: "Reservation Released",
        description: `Room ${room.number || room.room_number} reservation has been cancelled${refundAmount > 0 ? ` with ₦${refundAmount.toLocaleString()} refund` : ''}.`,
      });

      // Invalidate relevant queries for real-time UI updates
      const { useQueryClient } = await import('@tanstack/react-query');
      const queryClient = useQueryClient();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['folios', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['room-availability', tenantId] }),
      ]);

      const updatedRoom: Room = {
        ...room,
        status: 'available',
        guest: undefined,
        checkIn: undefined,
        checkOut: undefined,
        folio: { balance: 0, isPaid: true },
        alerts: {}
      };

      onComplete?.(updatedRoom);
      onOpenChange(false);

      // Reset form
      setReleaseReason("");
      setRefundAmount(0);
      setNotes("");
    } catch (error) {
      console.error('Error releasing room:', error);
      toast({
        title: "Release Failed",
        description: error instanceof Error ? error.message : "Failed to release reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            Release Reservation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-bold">Room {room?.number || room?.room_number}</div>
                  <div className="text-sm text-muted-foreground">{room?.type}</div>
                </div>
                <Badge variant="outline" className="text-amber-600">
                  Reserved
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{room?.guest || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{room?.checkIn || 'Today'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Release Reason */}
          <div className="space-y-3">
            <Label htmlFor="release-reason">Release Reason *</Label>
            <Select value={releaseReason} onValueChange={setReleaseReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason for release" />
              </SelectTrigger>
              <SelectContent>
                {RELEASE_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refund Amount */}
          <div className="space-y-3">
            <Label htmlFor="refund-amount">Refund Amount (₦)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 border rounded-md"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about the release..."
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-800">Confirm Release</div>
                <div className="text-amber-700">
                  This will cancel the reservation and make the room available for new bookings.
                  This action cannot be undone.
                </div>
              </div>
            </div>
          </div>

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
              onClick={handleRelease}
              disabled={!releaseReason || isProcessing}
              variant="destructive"
              className="flex-1"
            >
              {isProcessing ? "Releasing..." : "Release Reservation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};