import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCheckout } from '@/hooks/useCheckout';
import { useAtomicCheckoutV3 } from '@/hooks/useAtomicCheckoutV3';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { BillingOverview } from './BillingOverview';
import { ServiceSummaryModal } from './ServiceSummaryModal';
import { PaymentDialog } from './PaymentDialog';
import { EnhancedReceiptGenerator } from './EnhancedReceiptGenerator';
import { 
  User, 
  Calendar, 
  Clock, 
  CreditCard, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId?: string;
}

export const CheckoutDialog = ({ open, onOpenChange, roomId }: CheckoutDialogProps) => {
  const { checkoutSession, loading, error, fetchGuestBill, processPayment } = useCheckout(roomId);
  const { checkout, isLoading: isCheckingOut } = useAtomicCheckoutV3();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showServiceSummary, setShowServiceSummary] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch bill data when dialog opens
  React.useEffect(() => {
    if (open && roomId && !checkoutSession) {
      fetchGuestBill(roomId);
    }
  }, [open, roomId, checkoutSession, fetchGuestBill]);

  const handleSettleBills = () => {
    setShowPayment(true);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePaymentSuccess = async (amount: number, method: string) => {
    setIsRefreshing(true);
    try {
      const success = await processPayment(amount, method);
      if (success) {
        toast({
          title: "Payment Processed",
          description: `₦${amount.toLocaleString()} payment successful`,
        });
        
        // Refresh checkout session to show updated balance
        if (roomId) {
          await fetchGuestBill(roomId);
        }
        
        // Close payment dialog only after refresh completes
        setShowPayment(false);
      }
    } catch (error: any) {
      console.error('[Checkout Dialog] Payment refresh error:', error);
      toast({
        title: "Warning",
        description: "Payment recorded but display may need refresh",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Phase 2: Atomic checkout with proper FK-based reservation lookup
  const handleCompleteCheckout = async () => {
    if (!checkoutSession?.guest_bill?.room_id) return;
    
    // Phase 2: Use proper FK relationship to find active reservation
    const { data: room } = await supabase
      .from('rooms')
      .select(`
        id,
        reservation_id,
        current_reservation:reservations!rooms_reservation_id_fkey(id, status)
      `)
      .eq('id', checkoutSession.guest_bill.room_id)
      .single();

    let reservation = (room as any)?.current_reservation;
    
    // Fallback: Query by room_id if FK is null
    if (!reservation || reservation.status !== 'checked_in') {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('room_id', checkoutSession.guest_bill.room_id)
        .eq('status', 'checked_in')
        .order('check_in_date', { ascending: false })
        .limit(1);
      
      reservation = reservations?.[0];
    }

    if (!reservation) {
      toast({
        title: "Error",
        description: "No active reservation found for this room",
        variant: "destructive"
      });
      return;
    }

    console.log('[Checkout Dialog] Starting atomic checkout:', {
      reservationId: reservation.id,
      guestName: checkoutSession.guest_bill.guest_name
    });

    try {
      const result = await checkout({ reservationId: reservation.id });
      
      if (result.success) {
        console.log('[Checkout Dialog] Checkout successful, closing modal immediately');
        
        // Close dialog immediately to prevent refetch issues
        onOpenChange(false);
        
        // Show toast after closing to ensure it's visible
        setTimeout(() => {
          toast({
            title: "✓ Checkout Complete",
            description: `${checkoutSession.guest_bill.guest_name} checked out successfully`,
          });
        }, 100);
      } else {
        toast({
          title: "Checkout Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[Checkout Dialog] Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete checkout",
        variant: "destructive"
      });
    }
  };

  const handlePrintBill = () => {
    setShowReceipt(true);
  };

  if (loading && !checkoutSession) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-32" />
            </DialogTitle>
          </DialogHeader>
          
          {/* PERFORMANCE FIX: Enhanced skeleton screens for better UX */}
          <div className="space-y-6">
            {/* Guest Info Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Overview Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !checkoutSession) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error || 'Failed to load checkout data'}</p>
            <Button onClick={() => roomId && fetchGuestBill(roomId)} className="mt-4">
              Retry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { guest_bill } = checkoutSession;
  const canCheckout = checkoutSession.checkout_status === 'ready';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5" />
                Room {guest_bill.room_number} Checkout
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-1">
          {/* Guest Info Header */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{guest_bill.guest_name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {guest_bill.check_in_date} → {guest_bill.check_out_date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {guest_bill.stay_duration} nights
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={guest_bill.payment_status === 'paid' ? 'default' : 'destructive'}
                  className="text-sm"
                >
                  {guest_bill.payment_status === 'paid' ? 'Fully Paid' : 
                   guest_bill.payment_status === 'partial' ? 'Partial Payment' : 'Unpaid'}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Billing Overview */}
          <BillingOverview bill={guest_bill} />

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowServiceSummary(true)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Service Summary
            </Button>

            <Button 
              onClick={handleSettleBills}
              disabled={guest_bill.pending_balance <= 0}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Settle Bills
            </Button>

            <Button 
              variant="outline" 
              onClick={handlePrintBill}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Bill
            </Button>

            <Button 
              onClick={handleCompleteCheckout}
              disabled={!canCheckout || isCheckingOut || isRefreshing}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              {isCheckingOut ? 'Processing...' : isRefreshing ? 'Refreshing...' : 'Complete Checkout'}
            </Button>
          </div>

          {/* BILLING LOGIC FIX: Checkout Status with correct logic */}
          {!canCheckout && guest_bill.pending_balance > 0 && (
            <Card className="mt-4 border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    Outstanding Balance: ₦{guest_bill.pending_balance.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  All bills must be settled before checkout can be completed.
                </p>
              </CardContent>
            </Card>
          )}
          {/* Show success message for paid guests */}
          {canCheckout && (
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    All bills settled - Ready for checkout
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <ServiceSummaryModal 
        open={showServiceSummary}
        onOpenChange={setShowServiceSummary}
        services={guest_bill.service_charges}
      />

      <PaymentDialog 
        open={showPayment}
        onOpenChange={setShowPayment}
        pendingAmount={guest_bill.pending_balance}
        onPaymentSuccess={handlePaymentSuccess}
        folioId={guest_bill.folio_id}
        guestName={guest_bill.guest_name}
        roomNumber={guest_bill.room_number}
        triggerSource="checkout"
      />

      <EnhancedReceiptGenerator
        open={showReceipt}
        onOpenChange={setShowReceipt}
        guestBill={guest_bill}
      />
    </>
  );
};