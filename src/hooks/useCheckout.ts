import { useState, useEffect } from 'react';
import { GuestBill, CheckoutSession, ServiceCharge, PaymentRecord } from '@/types/billing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export const useCheckout = (roomId?: string) => {
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
  }, [checkoutSession?.room_id]);

  const fetchGuestBill = async (roomId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // PERFORMANCE FIX: Optimized parallel queries
      // Get room info and current reservation in parallel
      const [
        { data: room, error: roomError },
        { data: reservations, error: reservationError }
      ] = await Promise.all([
        supabase
          .from('rooms')
          .select(`
            *,
            room_types:room_type_id (*)
          `)
          .eq('id', roomId)
          .single(),
        supabase
          .from('reservations')
          .select('*')
          .eq('room_id', roomId)
          .eq('status', 'checked_in')
          .order('check_in_date', { ascending: false })
          .limit(1)
      ]);

      if (roomError) throw roomError;
      if (reservationError) throw reservationError;

      const reservation = reservations?.[0];
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
  };

  const processPayment = async (amount: number, paymentMethod: string) => {
    if (!checkoutSession || !user) return false;

    setLoading(true);
    try {
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

      // Create payment record (triggers will auto-update folio balance)
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          folio_id: folioId,
          amount,
          payment_method: paymentMethod,
          status: 'completed',
          processed_by: user.id,
          tenant_id: user.tenant_id
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

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

    setLoading(true);
    
    // Set timeout to prevent infinite processing
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Checkout timeout. Please refresh and try again.');
      }
    }, 30000); // 30 seconds timeout

    try {
      // Use transaction-like approach by batching operations (get most recent if multiple)
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', checkoutSession.room_id)
        .eq('status', 'checked_in')
        .order('check_in_date', { ascending: false })
        .limit(1);

      if (reservationError) throw reservationError;

      const reservation = reservations?.[0];
      if (!reservation) {
        throw new Error('No active reservation found');
      }

      // Get or create folio for the reservation
      const { data: folioId, error: folioIdError } = await supabase
        .rpc('get_or_create_folio', {
          p_reservation_id: reservation.id,
          p_tenant_id: user.tenant_id  
        });

      if (folioIdError || !folioId) {
        throw new Error('Failed to get or create folio');
      }

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

      const completedSession: CheckoutSession = {
        ...checkoutSession,
        checkout_status: 'completed',
        handled_by: user.id,
        completed_at: new Date().toISOString()
      };

      setCheckoutSession(completedSession);
      clearTimeout(timeoutId);
      return true;
    } catch (err: any) {
      console.error('Checkout completion error:', err);
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