import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, XCircle, Calendar, User, DollarSign, CreditCard, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShiftIntegratedAction } from "./ShiftIntegratedAction";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/hooks/useCurrency";
import type { Room } from "./RoomGrid";

interface CancelReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onComplete?: (room: Room) => void;
}

const CANCELLATION_REASONS = [
  'Guest requested cancellation',
  'No-show after grace period',
  'Payment failed',
  'Overbooking adjustment',
  'Guest upgraded to different room',
  'Force majeure/Emergency',
  'Duplicate booking',
  'Change in travel plans',
  'Other'
];

type PaymentAction = 'none' | 'refund' | 'credit' | 'forfeit';

interface PaymentInfo {
  totalPaid: number;
  hasPayment: boolean;
  paymentStatus: 'none' | 'partial' | 'full';
}

export const CancelReservationDialog = ({
  open,
  onOpenChange,
  room,
  onComplete,
}: CancelReservationDialogProps) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [paymentAction, setPaymentAction] = useState<PaymentAction>("none");
  const [refundAmount, setRefundAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    totalPaid: 0,
    hasPayment: false,
    paymentStatus: 'none'
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logShiftAction } = useShiftIntegratedAction();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();

  // Fetch payment information when dialog opens
  useEffect(() => {
    const loadPaymentInfo = async () => {
      if (!room || !open) return;

      const currentReservation = (room as any).current_reservation;
      if (!currentReservation?.id) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const tenantId = user.user_metadata?.tenant_id;
        if (!tenantId) return;

        // Get folio and payments
        const { data: folio } = await supabase
          .from('folios')
          .select(`
            *,
            payments:payments(amount, status)
          `)
          .eq('reservation_id', currentReservation.id)
          .eq('tenant_id', tenantId)
          .eq('status', 'open')
          .single();

        if (folio) {
          const totalPaid = folio.payments
            ?.filter((p: any) => p.status === 'completed')
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

          const totalCharges = Number(folio.total_charges || 0);
          
          let paymentStatus: PaymentInfo['paymentStatus'] = 'none';
          if (totalPaid === 0) {
            paymentStatus = 'none';
          } else if (totalPaid >= totalCharges) {
            paymentStatus = 'full';
          } else {
            paymentStatus = 'partial';
          }

          setPaymentInfo({
            totalPaid,
            hasPayment: totalPaid > 0,
            paymentStatus
          });

          // Auto-set refund amount to total paid
          if (totalPaid > 0) {
            setRefundAmount(totalPaid);
          }
        }
      } catch (error) {
        console.error('Error loading payment info:', error);
      }
    };

    loadPaymentInfo();
  }, [room, open]);

  // Check if reservation can be cancelled
  const canCancel = () => {
    if (!room) return false;
    
    const currentReservation = (room as any).current_reservation;
    if (!currentReservation) return false;

    const status = currentReservation.status;
    
    // Block cancellation for checked-in guests
    if (status === 'checked_in') {
      return false;
    }

    // Only allow for confirmed or pending
    return status === 'confirmed' || status === 'pending';
  };

  const getBlockedMessage = () => {
    if (!room) return null;
    
    const currentReservation = (room as any).current_reservation;
    if (!currentReservation) return null;

    if (currentReservation.status === 'checked_in') {
      return "Room is occupied. Please process Early Check-out instead.";
    }

    if (currentReservation.status === 'cancelled') {
      return "Reservation is already cancelled.";
    }

    if (currentReservation.status === 'checked_out') {
      return "Reservation is already checked out.";
    }

    return null;
  };

  const handleInitialCancel = () => {
    if (!cancellationReason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for cancellation",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmCancel = async () => {
    if (!room || !cancellationReason) return;

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        throw new Error('Tenant ID not found');
      }

      const currentReservation = (room as any).current_reservation;
      if (!currentReservation?.id) {
        throw new Error('No active reservation found for this room');
      }

      // Call enhanced cancel function with payment handling
      const { data, error } = await supabase.rpc('cancel_reservation_atomic', {
        p_tenant_id: tenantId,
        p_reservation_id: currentReservation.id,
        p_cancelled_by: user.id,
        p_reason: cancellationReason,
        p_refund_amount: refundAmount > 0 ? refundAmount : null,
        p_notes: notes || null,
        p_payment_action: paymentAction
      });

      if (error) {
        throw error;
      }

      const result = (Array.isArray(data) ? data[0] : data) as any;
      
      if (!result || result.success !== true) {
        const errorMsg = result?.message || 'Failed to cancel reservation';
        toast({
          title: "Cancellation Failed",
          description: errorMsg,
          variant: "destructive"
        });
        setIsProcessing(false);
        setShowConfirmation(false);
        return;
      }

      // Log shift action
      await logShiftAction({
        action: 'Cancel Reservation',
        roomNumber: room.room_number || room.number,
        guestName: room.guest,
        amount: refundAmount,
        metadata: {
          cancellation_reason: cancellationReason,
          payment_action: paymentAction,
          refund_amount: refundAmount,
          total_paid: paymentInfo.totalPaid,
          notes: notes,
          reservation_id: currentReservation.id
        }
      });

      // Aggressively invalidate and refetch queries for immediate UI update
      console.log('[Cancel] Invalidating queries for immediate room update');
      await queryClient.invalidateQueries({ queryKey: ['rooms', tenantId] });
      await queryClient.invalidateQueries({ queryKey: ['room-availability', tenantId] });
      await queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] });
      await queryClient.invalidateQueries({ queryKey: ['folios', tenantId] });
      
      // Force immediate refetch to update UI - wait for completion
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['rooms', tenantId], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['reservations', tenantId], type: 'active' })
      ]);
      
      console.log('[Cancel] Queries refetched, closing dialog');

      // Build success message
      let successMessage = `Room ${room.room_number || room.number} reservation has been cancelled.`;
      if (paymentAction === 'refund' && refundAmount > 0) {
        successMessage += ` ${formatPrice(refundAmount)} refund processed.`;
      } else if (paymentAction === 'credit' && refundAmount > 0) {
        successMessage += ` ${formatPrice(refundAmount)} credited to guest account.`;
      } else if (paymentAction === 'forfeit') {
        successMessage += ' Payment forfeited (non-refundable).';
      }

      toast({
        title: "Reservation Cancelled",
        description: successMessage,
      });

      // Invalidate queries for real-time UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['folios', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['payments', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['room-availability', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['billing', tenantId] }),
      ]);

      // Force refetch
      await queryClient.refetchQueries({ queryKey: ['rooms', tenantId] });

      const updatedRoom: Room = {
        ...room,
        status: 'available',
        guest: undefined,
        checkIn: undefined,
        checkOut: undefined,
        current_reservation: undefined,
        folio: { balance: 0, isPaid: true },
        alerts: {}
      };

      onComplete?.(updatedRoom);
      onOpenChange(false);
      setShowConfirmation(false);

      // Navigate back to front desk
      setTimeout(() => {
        navigate('/front-desk');
      }, 500);

      // Reset form
      setCancellationReason("");
      setPaymentAction("none");
      setRefundAmount(0);
      setNotes("");
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const blockedMessage = getBlockedMessage();
  const isBlocked = !canCancel();

  // Confirmation Dialog
  if (showConfirmation) {
    return (
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Cancellation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation for {room?.guest}, Room {room?.room_number || room?.number}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium">{cancellationReason}</span>
                </div>
                {paymentInfo.hasPayment && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-medium">{formatPrice(paymentInfo.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Action:</span>
                      <span className="font-medium capitalize">{paymentAction}</span>
                    </div>
                    {(paymentAction === 'refund' || paymentAction === 'credit') && refundAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium text-green-600">{formatPrice(refundAmount)}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive font-medium">
                ⚠️ This action cannot be undone. The room will be made available for new bookings.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessing}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                {isProcessing ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main Cancellation Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancel Reservation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-bold">Room {room?.room_number || room?.number}</div>
                  <div className="text-sm text-muted-foreground">{room?.room_type?.name || room?.type}</div>
                </div>
                <Badge variant="outline" className={
                  isBlocked ? "text-red-600" : "text-amber-600"
                }>
                  {(room as any)?.current_reservation?.status || 'Reserved'}
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

              {paymentInfo.hasPayment && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Paid:</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(paymentInfo.totalPaid)}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {paymentInfo.paymentStatus === 'full' ? 'Fully Paid' : 
                     paymentInfo.paymentStatus === 'partial' ? 'Partially Paid' : 'Unpaid'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked State Warning */}
          {isBlocked && blockedMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <Ban className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Cannot Cancel Reservation</div>
                  <div className="text-sm text-red-700 mt-1">{blockedMessage}</div>
                </div>
              </div>
            </div>
          )}

          {!isBlocked && (
            <>
              {/* Cancellation Reason */}
              <div className="space-y-3">
                <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
                <Select value={cancellationReason} onValueChange={setCancellationReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason for cancellation" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Handling - Only show if payment exists */}
              {paymentInfo.hasPayment && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <Label className="text-base font-semibold">Payment Handling</Label>
                  </div>

                  <RadioGroup value={paymentAction} onValueChange={(value) => setPaymentAction(value as PaymentAction)}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-background cursor-pointer">
                        <RadioGroupItem value="refund" id="refund" />
                        <Label htmlFor="refund" className="flex-1 cursor-pointer">
                          <div className="font-medium">Issue Refund</div>
                          <div className="text-sm text-muted-foreground">
                            Return payment to original payment method
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-background cursor-pointer">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="flex-1 cursor-pointer">
                          <div className="font-medium">Convert to Credit</div>
                          <div className="text-sm text-muted-foreground">
                            Keep as credit balance in guest account for future use
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-background cursor-pointer">
                        <RadioGroupItem value="forfeit" id="forfeit" />
                        <Label htmlFor="forfeit" className="flex-1 cursor-pointer">
                          <div className="font-medium">Forfeit Payment (Non-refundable)</div>
                          <div className="text-sm text-muted-foreground">
                            Payment is not returned to guest
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Refund Amount Input */}
                  {(paymentAction === 'refund' || paymentAction === 'credit') && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="refund-amount">
                        {paymentAction === 'refund' ? 'Refund Amount' : 'Credit Amount'} ({formatPrice(0)})
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          id="refund-amount"
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(Math.min(Number(e.target.value), paymentInfo.totalPaid))}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                          placeholder="0.00"
                          min="0"
                          max={paymentInfo.totalPaid}
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum: {formatPrice(paymentInfo.totalPaid)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about the cancellation..."
                  rows={3}
                />
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-800">Important</div>
                    <div className="text-amber-700">
                      This will cancel the reservation and make the room available for new bookings.
                      This action cannot be undone.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
            {!isBlocked && (
              <Button
                onClick={handleInitialCancel}
                disabled={!cancellationReason || isProcessing}
                variant="destructive"
                className="flex-1"
              >
                Cancel Reservation
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};