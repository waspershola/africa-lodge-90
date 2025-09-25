import { useEffect } from 'react';
import { useSendReservationConfirmation } from '@/hooks/useEnhancedReservations';
import { useToast } from '@/hooks/use-toast';

interface AutoEmailTriggersProps {
  reservation: {
    id: string;
    status: string;
    payment_status?: string;
    guest_email?: string;
    group_reservation_id?: string;
    confirmation_sent_at?: string;
  };
  emailSettings: {
    send_to_individuals?: boolean;
    email_templates?: {
      [key: string]: { enabled: boolean };
    };
  };
}

export default function AutoEmailTriggers({ reservation, emailSettings }: AutoEmailTriggersProps) {
  const sendConfirmation = useSendReservationConfirmation();
  const { toast } = useToast();

  // Auto-send confirmation email when reservation is confirmed
  useEffect(() => {
    if (
      reservation.status === 'confirmed' &&
      !reservation.confirmation_sent_at &&
      reservation.guest_email &&
      emailSettings.email_templates?.confirmation?.enabled
    ) {
      console.log('Auto-sending confirmation email for reservation:', reservation.id);
      
      sendConfirmation.mutate({
        reservationId: reservation.id,
        type: 'confirmation'
      });
    }
  }, [reservation.status, reservation.confirmation_sent_at, reservation.id, reservation.guest_email]);

  // Auto-send payment reminders for overdue payments
  useEffect(() => {
    if (
      reservation.payment_status === 'overdue' &&
      reservation.guest_email &&
      emailSettings.email_templates?.reminder?.enabled
    ) {
      console.log('Auto-sending payment reminder for reservation:', reservation.id);
      
      // In real implementation, this would check if reminder was already sent recently
      sendConfirmation.mutate({
        reservationId: reservation.id,
        type: 'reminder'
      });
    }
  }, [reservation.payment_status, reservation.id, reservation.guest_email]);

  // Auto-send individual confirmations for group bookings
  useEffect(() => {
    if (
      reservation.status === 'confirmed' &&
      reservation.group_reservation_id &&
      emailSettings.send_to_individuals &&
      !reservation.confirmation_sent_at &&
      reservation.guest_email
    ) {
      console.log('Auto-sending individual confirmation for group member:', reservation.id);
      
      sendConfirmation.mutate({
        reservationId: reservation.id,
        type: 'confirmation'
      });
    }
  }, [
    reservation.status, 
    reservation.group_reservation_id, 
    emailSettings.send_to_individuals,
    reservation.confirmation_sent_at,
    reservation.id,
    reservation.guest_email
  ]);

  // This component doesn't render anything - it's just for side effects
  return null;
}