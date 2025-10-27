// Phase 8: Recovery Mechanism for Incomplete Reservations
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

interface CancelIncompleteReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  roomId: string;
  guestName: string;
  onSuccess: () => void;
}

export function CancelIncompleteReservationDialog({
  open,
  onOpenChange,
  reservationId,
  roomId,
  guestName,
  onSuccess
}: CancelIncompleteReservationDialogProps) {
  const { user, tenant } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async () => {
    setIsProcessing(true);
    
    try {
      // Phase 6: Validate token before critical cascading deletions
      await validateAndRefreshToken();
      
      console.log('[RECOVERY] Canceling incomplete reservation:', reservationId);
      
      // Get folio associated with reservation
      const { data: folio } = await supabase
        .from('folios')
        .select('id')
        .eq('reservation_id', reservationId)
        .single();

      if (folio) {
        // Delete any payments
        await supabase
          .from('payments')
          .delete()
          .eq('folio_id', folio.id);

        // Delete folio charges
        await supabase
          .from('folio_charges')
          .delete()
          .eq('folio_id', folio.id);

        // Delete folio
        await supabase
          .from('folios')
          .delete()
          .eq('id', folio.id);
      }

      // Delete reservation
      await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

      // Reset room to available
      await supabase
        .from('rooms')
        .update({ 
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      // Create audit log
      await supabase
        .from('audit_log')
        .insert({
          action: 'INCOMPLETE_RESERVATION_CANCELED',
          resource_type: 'RESERVATION',
          resource_id: reservationId,
          actor_id: user?.id,
          actor_email: user?.email,
          actor_role: user?.role,
          tenant_id: tenant?.tenant_id,
          description: `Canceled incomplete reservation for ${guestName}`,
          metadata: {
            room_id: roomId,
            guest_name: guestName
          }
        });

      toast.success('Incomplete reservation canceled successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[RECOVERY] Error canceling reservation:', error);
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Incomplete Reservation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel the reservation for <strong>{guestName}</strong> and reset the room status.
            Any associated folio charges and payments will be deleted.
            <br /><br />
            <span className="text-amber-600 font-medium">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            Keep Reservation
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel}
            disabled={isProcessing}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isProcessing ? 'Canceling...' : 'Cancel Reservation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
