import { useState, useEffect } from 'react';
import { GuestBill, CheckoutSession, ServiceCharge, PaymentRecord } from '@/types/billing';

// Mock data for development - replace with Supabase calls
const mockServiceCharges: ServiceCharge[] = [
  {
    id: '1',
    service_type: 'room',
    description: 'Deluxe Room - 3 nights',
    amount: 75000,
    status: 'pending',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    service_type: 'restaurant',
    description: 'Room Service Orders',
    amount: 12500,
    status: 'pending',
    created_at: '2024-01-16T14:30:00Z',
    staff_name: 'John Chef'
  },
  {
    id: '3',
    service_type: 'housekeeping',
    description: 'Extra Towels & Amenities',
    amount: 2000,
    status: 'paid',
    created_at: '2024-01-16T10:00:00Z',
    staff_name: 'Mary HK'
  }
];

export const useCheckout = (roomId?: string) => {
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuestBill = async (roomId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call - replace with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBill: GuestBill = {
        room_id: roomId,
        room_number: '205',
        guest_name: 'John Smith',
        check_in_date: '2024-01-15',
        check_out_date: '2024-01-18',
        stay_duration: 3,
        service_charges: mockServiceCharges,
        subtotal: 89500,
        tax_amount: 8950,
        total_amount: 98450,
        pending_balance: 87500, // room + restaurant charges
        payment_status: 'partial'
      };

      const session: CheckoutSession = {
        room_id: roomId,
        guest_bill: mockBill,
        payment_records: [],
        checkout_status: mockBill.pending_balance > 0 ? 'pending' : 'ready'
      };

      setCheckoutSession(session);
    } catch (err) {
      setError('Failed to fetch guest bill');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (amount: number, paymentMethod: string) => {
    if (!checkoutSession) return false;

    setLoading(true);
    try {
      // Mock payment processing - replace with Supabase
      await new Promise(resolve => setTimeout(resolve, 1500));

      const paymentRecord: PaymentRecord = {
        id: Date.now().toString(),
        bill_id: checkoutSession.guest_bill.room_id,
        amount,
        payment_method: paymentMethod,
        status: 'completed',
        processed_by: 'Current Staff', // Replace with auth user
        processed_at: new Date().toISOString()
      };

      const updatedBill = {
        ...checkoutSession.guest_bill,
        pending_balance: Math.max(0, checkoutSession.guest_bill.pending_balance - amount),
        payment_status: (checkoutSession.guest_bill.pending_balance - amount) <= 0 ? 'paid' as const : 'partial' as const
      };

      const updatedSession: CheckoutSession = {
        ...checkoutSession,
        guest_bill: updatedBill,
        payment_records: [...checkoutSession.payment_records, paymentRecord],
        checkout_status: updatedBill.pending_balance <= 0 ? 'ready' : 'pending'
      };

      setCheckoutSession(updatedSession);
      return true;
    } catch (err) {
      setError('Payment processing failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeCheckout = async () => {
    if (!checkoutSession || checkoutSession.checkout_status !== 'ready') return false;

    setLoading(true);
    try {
      // Mock checkout completion - replace with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));

      const completedSession: CheckoutSession = {
        ...checkoutSession,
        checkout_status: 'completed',
        handled_by: 'Current Staff', // Replace with auth user
        completed_at: new Date().toISOString()
      };

      setCheckoutSession(completedSession);
      return true;
    } catch (err) {
      setError('Checkout completion failed');
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