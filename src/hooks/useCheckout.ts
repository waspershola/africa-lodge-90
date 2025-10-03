import { useState, useEffect, useCallback } from 'react';
import { GuestBill, CheckoutSession, ServiceCharge, PaymentRecord } from '@/types/billing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { mapToCanonicalPaymentMethod } from '@/lib/payment-method-mapper';

export const useCheckout = (roomId?: string) => {
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchGuestBill = useCallback(async (roomId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Phase 2: Optimized reservation lookup using proper FK relationship
      // Get room with current reservation via rooms.reservation_id FK
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types:room_type_id (*),
          current_reservation:reservations!rooms_reservation_id_fkey(*)
        `)
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Check if room has active reservation via FK
      let reservation = (room as any).current_reservation;
      
      // Fallback: If no current_reservation via FK, query by room_id for checked-in status
      if (!reservation || reservation.status !== 'checked_in') {
        const { data: reservations, error: reservationError } = await supabase
          .from('reservations')
          .select('*')
          .eq('room_id', roomId)
          .eq('status', 'checked_in')
          .order('check_in_date', { ascending: false })
          .limit(1);

        if (reservationError) throw reservationError;
        reservation = reservations?.[0];
      }

      if (!reservation) {
        throw new Error('No active reservation found for this room');
      }

      // Get or create folio for this reservation
      const { data: folioId, error: folioIdError } = await supabase
        .rpc('get_or_create_folio', {
          p_reservation_id: reservation.id,
          p_tenant_id: reservation.tenant_id
        });

      if (folioIdError) throw folioIdError;
      if (!folioId) {
        throw new Error('Failed to get or create folio for reservation');
      }

      // Get the folio with its charges and payments in parallel
      const [
        { data: folio, error: folioError },
        { data: charges, error: chargesError },
        { data: payments, error: paymentsError }
      ] = await Promise.all([
        supabase.from('folios').select('*').eq('id', folioId).single(),
        supabase.from('folio_charges').select('*').eq('folio_id', folioId),
        supabase.from('payments').select('*').eq('folio_id', folioId)
      ]);

      if (folioError) throw folioError;
      if (chargesError) throw chargesError;
      if (paymentsError) throw paymentsError;

      const serviceCharges: ServiceCharge[] = charges?.map(charge => ({
        id: charge.id,
        service_type: charge.charge_type as ServiceCharge['service_type'],
        description: charge.description,
        amount: Number(charge.amount),
        status: 'pending' as const,
        created_at: charge.created_at || '',
        staff_name: charge.posted_by || undefined
      })) || [];

      const paymentRecords: PaymentRecord[] = payments?.map(payment => ({
        id: payment.id,
        bill_id: folio.id,
        amount: Number(payment.amount),
        payment_method: payment.payment_method,
        status: payment.status as PaymentRecord['status'],
        processed_by: payment.processed_by || '',
        processed_at: payment.created_at || ''
      })) || [];

      // Use folio balance directly from database (includes tax calculation via triggers)
      const totalCharges = Number(folio.total_charges) || 0;
      const taxAmount = Number(folio.tax_amount) || 0;
      const totalAmount = totalCharges + taxAmount;
      const totalPaid = Number(folio.total_payments) || 0;
      const balance = Number(folio.balance) || 0;
      const pendingBalance = Math.max(0, balance);
      
      // Determine payment status
      let paymentStatus: 'paid' | 'partial' | 'unpaid';
      if (balance <= 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'unpaid';
      }

      const guestBill: GuestBill = {
        folio_id: folio.id,
        folio_number: folio.folio_number,
        room_id: roomId,
        room_number: room.room_number,
        guest_name: reservation.guest_name,
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        stay_duration: Math.ceil(
          (new Date(reservation.check_out_date).getTime() - 
           new Date(reservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
        ),
        service_charges: serviceCharges,
        subtotal: totalCharges,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        pending_balance: pendingBalance,
        payment_status: paymentStatus
      };

      const session: CheckoutSession = {
        room_id: roomId,
        guest_bill: guestBill,
        payment_records: paymentRecords,
        checkout_status: balance <= 0 ? 'ready' : 'pending'
      };

      setCheckoutSession(session);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch guest bill');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscription for folio updates
  useEffect(() => {
    if (!checkoutSession?.room_id) return;

    const channel = supabase
      .channel(`checkout-${checkoutSession.room_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folios'
        },
        () => {
          // Refetch data when folio changes
          fetchGuestBill(checkoutSession.room_id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          // Refetch data when payments change
          fetchGuestBill(checkoutSession.room_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkoutSession?.room_id, fetchGuestBill]);

  const processPayment = async (amount: number, paymentMethod: string) => {
    if (!checkoutSession || !user) return false;

    setLoading(true);
    try {
      // Phase 4: Validate payment data before processing
      const { validatePaymentData, parsePaymentError } = await import('@/lib/payment-validation');
      
      const validation = validatePaymentData({
        amount,
        paymentMethod,
      });

      if (!validation.valid) {
        setError(validation.error || 'Payment validation failed');
        return false;
      }

      console.log('[Checkout Payment] Starting payment processing:', {
        amount,
        method: paymentMethod,
        roomId: checkoutSession.room_id,
      });

      // Get the reservation
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', checkoutSession.room_id)
        .eq('status', 'checked_in')
        .order('check_in_date', { ascending: false })
        .limit(1);

      const reservation = reservations?.[0];
      if (!reservation) throw new Error('No active reservation found');

      // Get or create folio
      const { data: folioId, error: folioError } = await supabase
        .rpc('get_or_create_folio', {
          p_reservation_id: reservation.id,
          p_tenant_id: user.tenant_id
        });

      if (folioError || !folioId) throw new Error('Failed to get or create folio');

      console.log('[Checkout Payment] Creating payment for folio:', folioId);

      // Map payment method to canonical database value
      const canonicalMethod = mapToCanonicalPaymentMethod(paymentMethod);
      console.log('[Checkout Payment] Mapped payment method:', { original: paymentMethod, canonical: canonicalMethod });

      // Create payment record (triggers will auto-update folio balance and validate)
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          folio_id: folioId,
          amount,
          payment_method: canonicalMethod,
          status: 'completed',
          processed_by: user.id,
          tenant_id: user.tenant_id
        }])
        .select()
        .single();

      if (paymentError) {
        const userMessage = parsePaymentError(paymentError);
        console.error('[Checkout Payment] Payment error:', paymentError);
        throw new Error(userMessage);
      }

      console.log('[Checkout Payment] Payment created successfully:', payment.id);

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'payment_processed',
          resource_type: 'payment',
          resource_id: payment.id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Processed ${paymentMethod} payment of ${amount} for folio ${folioId}`,
          new_values: { amount, payment_method: paymentMethod }
        }]);

      // Refetch guest bill to get updated balance from database
      await fetchGuestBill(checkoutSession.room_id);
      
      return true;
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Payment processing failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeCheckout = async () => {
    if (!checkoutSession || checkoutSession.checkout_status !== 'ready' || !user) return false;

    console.log('[Checkout Hook] Starting checkout completion:', {
      roomId: checkoutSession.room_id,
      guestName: checkoutSession.guest_bill?.guest_name
    });

    setLoading(true);
    
    // Set timeout to prevent infinite processing
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Checkout timeout. Please refresh and try again.');
      }
    }, 30000); // 30 seconds timeout

    try {
      // Phase 2: Use proper FK relationship for active reservation lookup
      // First try rooms.reservation_id (current active reservation FK)
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          id,
          reservation_id,
          current_reservation:reservations!rooms_reservation_id_fkey(id, status)
        `)
        .eq('id', checkoutSession.room_id)
        .single();

      if (roomError) throw roomError;

      let reservation = (room as any).current_reservation;
      
      // Fallback: Query by room_id if FK is null or not checked-in
      if (!reservation || reservation.status !== 'checked_in') {
        const { data: reservations, error: reservationError } = await supabase
          .from('reservations')
          .select('id, status')
          .eq('room_id', checkoutSession.room_id)
          .eq('status', 'checked_in')
          .order('check_in_date', { ascending: false })
          .limit(1);

        if (reservationError) throw reservationError;
        reservation = reservations?.[0];
      }

      if (!reservation) {
        throw new Error('No active reservation found');
      }

      console.log('[Checkout Hook] Found reservation:', reservation.id);

      // Get or create folio for the reservation
      const { data: folioId, error: folioIdError } = await supabase
        .rpc('get_or_create_folio', {
          p_reservation_id: reservation.id,
          p_tenant_id: user.tenant_id  
        });

      if (folioIdError || !folioId) {
        throw new Error('Failed to get or create folio');
      }

      console.log('[Checkout Hook] Closing folio:', folioId);

      // Execute all updates in sequence with proper error handling
      const updates = [
        // Close the folio
        supabase
          .from('folios')
          .update({
            status: 'closed',
            closed_by: user.id,
            closed_at: new Date().toISOString()
          })
          .eq('id', folioId),

        // Update reservation status to checked out
        supabase
          .from('reservations')
          .update({
            status: 'checked_out',
            checked_out_at: new Date().toISOString(),
            checked_out_by: user.id
          })
          .eq('id', reservation.id),

        // Update room status to dirty (needs cleaning)
        supabase
          .from('rooms')
          .update({ status: 'dirty' })
          .eq('id', checkoutSession.room_id),

        // Create audit log
        supabase
          .from('audit_log')
          .insert([{
            action: 'checkout_completed',
            resource_type: 'reservation',
            resource_id: reservation.id,
            actor_id: user.id,
            actor_email: user.email,
            actor_role: user.role,
            tenant_id: user.tenant_id,
            description: `Completed checkout for room ${checkoutSession.guest_bill.room_number}`
          }])
      ];

      // Execute all updates
      const results = await Promise.all(updates);
      
      // Check for any errors
      for (const result of results) {
        if (result.error) {
          throw new Error(`Update failed: ${result.error.message}`);
        }
      }

      console.log('[Checkout Hook] Database updates complete');

      const completedSession: CheckoutSession = {
        ...checkoutSession,
        checkout_status: 'completed',
        handled_by: user.id,
        completed_at: new Date().toISOString()
      };

      setCheckoutSession(completedSession);
      clearTimeout(timeoutId);
      
      console.log('[Checkout Hook] Checkout completion successful');
      return true;
    } catch (err: any) {
      console.error('[Checkout Hook] Checkout completion error:', err);
      setError(err.message || 'Checkout completion failed');
      clearTimeout(timeoutId);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkoutSession,
    loading,
    error,
    fetchGuestBill,
    processPayment,
    completeCheckout
  };
};