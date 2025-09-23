import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface BillingStats {
  totalRevenue: number;
  pendingPayments: number;
  totalInvoices: number;
  outstandingBalance: number;
  todaysCashflow: Record<string, number>;
}

export interface FolioBalance {
  folio_id: string;
  folio_number: string;
  reservation_id: string;
  guest_name: string;
  room_number: string;
  total_charges: number;
  total_payments: number;
  balance: number;
  status: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  processed_by: string;
  folio_id: string;
  reference?: string;
}

export function useBilling() {
  const { tenant } = useAuth();
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [folioBalances, setFolioBalances] = useState<FolioBalance[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBillingStats = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get daily revenue
      const { data: dailyRevenue, error: revenueError } = await supabase
        .rpc('fn_daily_revenue', {
          tenant_uuid: tenant.tenant_id,
          start_date: today,
          end_date: today
        });

      if (revenueError) throw revenueError;

      // Get payment method breakdown
      const { data: paymentMethods, error: pmError } = await supabase
        .rpc('get_revenue_by_payment_method', {
          p_tenant_id: tenant.tenant_id,
          p_start_date: today,
          p_end_date: today
        });

      if (pmError) throw pmError;

      // Get outstanding balances from folios
      const { data: folios, error: folioError } = await supabase
        .from('folios')
        .select(`
          *,
          reservations!inner(
            guest_name,
            rooms!inner(room_number)
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'open');

      if (folioError) throw folioError;

      // Calculate outstanding balances
      let totalOutstanding = 0;
      let pendingCount = 0;
      
      for (const folio of folios || []) {
        // Get charges for this folio
        const { data: charges } = await supabase
          .from('folio_charges')
          .select('amount')
          .eq('folio_id', folio.id);
          
        // Get payments for this folio
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('folio_id', folio.id)
          .eq('status', 'completed');
          
        const totalCharges = charges?.reduce((sum, c) => sum + c.amount, 0) || 0;
        const totalPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const balance = totalCharges - totalPayments;
        
        if (balance > 0) {
          totalOutstanding += balance;
          pendingCount++;
        }
      }

      // Get total invoices count
      const { count: invoiceCount, error: invoiceError } = await supabase
        .from('folios')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (invoiceError) throw invoiceError;

      const todayRevenue = dailyRevenue?.[0] || { total_revenue: 0 };

      // Build payment methods cashflow
      const cashflow: Record<string, number> = {};
      paymentMethods?.forEach((pm) => {
        cashflow[pm.payment_method] = pm.total_amount || 0;
      });

      setBillingStats({
        totalRevenue: todayRevenue.total_revenue,
        pendingPayments: pendingCount,
        totalInvoices: invoiceCount || 0,
        outstandingBalance: totalOutstanding,
        todaysCashflow: cashflow
      });
    } catch (err) {
      console.error('Error loading billing stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing stats');
    }
  };

  const loadFolioBalances = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_folio_balances', {
          p_tenant_id: tenant.tenant_id,
          p_status: 'all'
        });

      if (error) throw error;

      // Map the response to FolioBalance format
      const balances: FolioBalance[] = (data || []).map(item => ({
        folio_id: item.folio_id,
        folio_number: item.folio_number,
        reservation_id: item.reservation_id,
        guest_name: item.guest_name,
        room_number: item.room_number,
        total_charges: item.total_charges,
        total_payments: item.total_payments,
        balance: item.balance,
        status: item.balance > 0 ? 'outstanding' : 'paid'
      }));
      
      setFolioBalances(balances);
    } catch (err) {
      console.error('Error loading folio balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load folio balances');
    }
  };

  const loadPayments = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          folios!inner(
            folio_number,
            reservations!inner(
              guest_name,
              rooms!inner(room_number)
            )
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    }
  };

  const createPayment = async (paymentData: {
    folio_id: string;
    amount: number;
    payment_method: string;
    reference?: string;
  }) => {
    if (!tenant?.tenant_id) return null;

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          tenant_id: tenant.tenant_id,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh data
      await Promise.all([loadBillingStats(), loadFolioBalances(), loadPayments()]);
      
      return data;
    } catch (err) {
      console.error('Error creating payment:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (tenant?.tenant_id) {
      const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
          loadBillingStats(),
          loadFolioBalances(),
          loadPayments()
        ]);
        setLoading(false);
      };

      loadAllData();
    }
  }, [tenant?.tenant_id]);

  const refresh = () => {
    if (tenant?.tenant_id) {
      Promise.all([
        loadBillingStats(),
        loadFolioBalances(),
        loadPayments()
      ]);
    }
  };

  return {
    billingStats,
    folioBalances,
    payments,
    loading,
    error,
    createPayment,
    refresh
  };
}