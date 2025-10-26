import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useBilling } from './useBilling';

interface ShiftCashData {
  shiftId: string;
  cashTotal: number;
  posTotal: number;
  expectedCash?: number;
  variance?: number;
  reconciliationNotes?: string;
}

interface CashVarianceReport {
  shift_id: string;
  expected_cash: number;
  actual_cash: number;
  variance: number;
  variance_percentage: number;
  pos_transactions: number;
  cash_transactions: number;
  reconciled_by: string;
  reconciled_at: string;
}

export const useShiftCashReconciliation = () => {
  const { tenant } = useAuth();
  const { createPayment, refresh: refreshBilling } = useBilling();

  const calculateExpectedCash = useQuery({
    queryKey: ['expected-cash-calculation', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return null;

      // Get today's cash transactions from payments
      const today = new Date().toISOString().split('T')[0];
      const { data: cashPayments, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenant.tenant_id)
        .eq('payment_method', 'cash')
        .gte('created_at', today)
        .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;

      const expectedCash = cashPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      
      return {
        expected_cash: expectedCash,
        transaction_count: cashPayments?.length || 0
      };
    },
    enabled: !!tenant?.tenant_id,
    staleTime: 60000 // 1 minute
  });

  const reconcileShiftCash = useMutation({
    mutationFn: async (data: ShiftCashData) => {
      const expectedCash = calculateExpectedCash.data?.expected_cash || 0;
      const variance = data.cashTotal - expectedCash;
      const variancePercentage = expectedCash > 0 ? (variance / expectedCash) * 100 : 0;

      // Record cash reconciliation
      const reconciliationRecord = {
        shift_id: data.shiftId,
        expected_cash: expectedCash,
        actual_cash: data.cashTotal,
        pos_total: data.posTotal,
        variance,
        variance_percentage: variancePercentage,
        reconciliation_notes: data.reconciliationNotes,
        reconciled_by: (await supabase.auth.getUser()).data.user?.id,
        reconciled_at: new Date().toISOString()
      };

      // If there's a significant variance, flag for review
      if (Math.abs(variancePercentage) > 5) {
        reconciliationRecord.reconciliation_notes = 
          (data.reconciliationNotes || '') + 
          ` [VARIANCE ALERT: ${variance > 0 ? 'Over' : 'Under'} by $${Math.abs(variance).toFixed(2)} (${Math.abs(variancePercentage).toFixed(1)}%)]`;
      }

      // Record the cash deposit as a payment if positive
      if (data.cashTotal > 0) {
        await createPayment({
          folio_id: 'cash-deposit-' + data.shiftId,
          amount: data.cashTotal,
          payment_method: 'cash',
          reference: `Shift Cash Deposit - ${data.shiftId}`
        });
      }

      // Record POS total if provided
      if (data.posTotal > 0) {
        await createPayment({
          folio_id: 'pos-settlement-' + data.shiftId,
          amount: data.posTotal,
          payment_method: 'card',
          reference: `Shift POS Settlement - ${data.shiftId}`
        });
      }

      // Refresh billing data to reflect new payments
      refreshBilling();

      return reconciliationRecord;
    }
  });

  const getShiftVarianceHistory = useQuery({
    queryKey: ['shift-variance-history', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      // This would query a cash_reconciliation table if we had one
      // For now, return mock data structure
      const mockData: CashVarianceReport[] = [];
      
      return mockData;
    },
    enabled: !!tenant?.tenant_id
  });

  const flagSignificantVariance = useMutation({
    mutationFn: async ({ 
      shiftId, 
      variance, 
      reason 
    }: { 
      shiftId: string; 
      variance: number; 
      reason: string; 
    }) => {
      // Log significant variance for management review
      const { error } = await supabase
        .from('audit_log')
        .insert({
          action: 'CASH_VARIANCE_FLAGGED',
          resource_type: 'SHIFT_SESSION',
          resource_id: shiftId,
          description: `Significant cash variance detected: $${variance.toFixed(2)}`,
          metadata: {
            variance_amount: variance,
            variance_reason: reason,
            flagged_for_review: true,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
      return { success: true };
    }
  });

  return {
    calculateExpectedCash,
    reconcileShiftCash,
    getShiftVarianceHistory,
    flagSignificantVariance,
    expectedCashData: calculateExpectedCash.data
  };
};