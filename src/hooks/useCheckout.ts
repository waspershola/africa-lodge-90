import { useState } from 'react';
import { GuestBill, CheckoutSession, ServiceCharge, PaymentRecord } from '@/types/billing';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export const useCheckout = (roomId?: string) => {
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchGuestBill = async (roomId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock guest bill data for now
      const mockServiceCharges: ServiceCharge[] = [
        {
          id: '1',
          service_type: 'room',
          description: 'Room charges',
          amount: 15000,
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      ];

      const mockPaymentRecords: PaymentRecord[] = [];

      const subtotal = mockServiceCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const taxAmount = subtotal * 0.075; // 7.5% VAT
      const totalAmount = subtotal + taxAmount;
      const totalPaid = mockPaymentRecords.reduce((sum, payment) => 
        payment.status === 'completed' ? sum + payment.amount : sum, 0);
      const pendingBalance = Math.max(0, totalAmount - totalPaid);

      const guestBill: GuestBill = {
        room_id: roomId,
        room_number: `Room ${roomId}`,
        guest_name: 'John Doe',
        check_in_date: '2024-01-01',
        check_out_date: '2024-01-03',
        stay_duration: 2,
        service_charges: mockServiceCharges,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        pending_balance: pendingBalance,
        payment_status: pendingBalance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid'
      };

      const session: CheckoutSession = {
        room_id: roomId,
        guest_bill: guestBill,
        payment_records: mockPaymentRecords,
        checkout_status: pendingBalance <= 0 ? 'ready' : 'pending'
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
      const paymentRecord: PaymentRecord = {
        id: `payment-${Date.now()}`,
        bill_id: 'folio-123',
        amount,
        payment_method: paymentMethod,
        status: 'completed',
        processed_by: user.id,
        processed_at: new Date().toISOString()
      };

      const totalPaid = checkoutSession.payment_records.reduce((sum, p) => sum + p.amount, 0) + amount;
      const newBalance = Math.max(0, checkoutSession.guest_bill.total_amount - totalPaid);

      const updatedBill = {
        ...checkoutSession.guest_bill,
        pending_balance: newBalance,
        payment_status: newBalance <= 0 ? 'paid' as const : totalPaid > 0 ? 'partial' as const : 'unpaid' as const
      };

      const updatedSession: CheckoutSession = {
        ...checkoutSession,
        guest_bill: updatedBill,
        payment_records: [...checkoutSession.payment_records, paymentRecord],
        checkout_status: newBalance <= 0 ? 'ready' : 'pending'
      };

      setCheckoutSession(updatedSession);
      return true;
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeCheckout = async () => {
    if (!checkoutSession || checkoutSession.checkout_status !== 'ready' || !user) return false;

    setLoading(true);
    try {
      const completedSession: CheckoutSession = {
        ...checkoutSession,
        checkout_status: 'completed',
        handled_by: user.id,
        completed_at: new Date().toISOString()
      };

      setCheckoutSession(completedSession);
      return true;
    } catch (err: any) {
      setError(err.message || 'Checkout completion failed');
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