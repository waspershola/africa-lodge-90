// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface GuestDebt {
  id: string;
  guest_id: string;
  guest_name: string;
  room_number: string;
  phone: string;
  email: string;
  total_debt: number;
  outstanding_amount: number;
  payment_mode: string;
  check_in_date: string;
  check_out_date: string;
  days_overdue: number;
  status: 'outstanding' | 'partial' | 'overdue' | 'critical' | 'resolved';
  notes?: string;
}

export function useDebtTracking() {
  const { tenant } = useAuth();
  const [debts, setDebts] = useState<GuestDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDebts = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('debt_tracking')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .neq('status', 'resolved');

      if (error) throw error;

      const mappedDebts: GuestDebt[] = (data || []).map(debt => ({
        id: debt.id,
        guest_id: debt.guest_id,
        guest_name: 'Guest Name', // Will be populated from actual guest data
        room_number: 'Room', // Will be populated from actual room data
        phone: '',
        email: '',
        total_debt: debt.amount_owed,
        outstanding_amount: debt.amount_owed,
        payment_mode: debt.status === 'outstanding' ? 'Pay Later' : 'Debtor Account',
        check_in_date: '',
        check_out_date: '',
        days_overdue: debt.overdue_days || 0,
        status: debt.status as 'outstanding' | 'partial' | 'overdue' | 'critical' | 'resolved',
        notes: debt.notes || undefined
      }));

      setDebts(mappedDebts);
    } catch (err) {
      console.error('Error loading debt tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load debt data');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (debtId: string, amount: number, paymentMethod: string, notes?: string) => {
    if (!tenant?.tenant_id) return null;

    try {
      // Find the debt record
      const debt = debts.find(d => d.id === debtId);
      if (!debt) throw new Error('Debt record not found');

      // Create payment record in payments table
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenant.tenant_id,
          folio_id: debt.id, // This would need to be properly linked to folio
          amount,
          payment_method: paymentMethod,
          status: 'completed',
          reference: `DEBT-${Date.now()}`
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update debt tracking record
      const newOutstanding = Math.max(0, debt.outstanding_amount - amount);
      const newStatus = newOutstanding === 0 ? 'resolved' : debt.status;

      const { error: updateError } = await supabase
        .from('debt_tracking')
        .update({
          amount_owed: newOutstanding,
          status: newStatus,
          notes: notes || debt.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', debtId);

      if (updateError) throw updateError;

      // Refresh the debts list
      await loadDebts();

      return payment;
    } catch (err) {
      console.error('Error recording payment:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (tenant?.tenant_id) {
      loadDebts();
    }
  }, [tenant?.tenant_id]);

  const refresh = () => {
    if (tenant?.tenant_id) {
      loadDebts();
    }
  };

  const totalOutstanding = debts.reduce((sum, debt) => sum + debt.outstanding_amount, 0);
  const overdueCases = debts.filter(debt => debt.status === 'overdue' || debt.status === 'critical').length;
  const activeCases = debts.filter(debt => debt.status !== 'resolved').length;
  const avgDaysOverdue = debts.length > 0 
    ? Math.round(debts.reduce((sum, debt) => sum + debt.days_overdue, 0) / debts.length) 
    : 0;

  return {
    debts,
    loading,
    error,
    recordPayment,
    refresh,
    totalOutstanding,
    overdueCases,
    activeCases,
    avgDaysOverdue
  };
}