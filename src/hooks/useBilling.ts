import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQueryClient } from '@tanstack/react-query';

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
  payment_method_id?: string;
  status: string;
  created_at: string;
  processed_by: string;
  folio_id: string;
  reference?: string;
}

export function useBilling() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
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
            rooms!reservations_room_id_fkey(room_number)
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

  // Phase 2: Scoped folio balance query
  const getFolioBalance = async (folioId: string, tenantId: string): Promise<FolioBalance | null> => {
    try {
      // Validate tenant matches current user's tenant
      if (tenantId !== tenant?.tenant_id) {
        throw new Error('Invalid folio reference - tenant mismatch');
      }

      const { data, error } = await supabase
        .rpc('get_folio_balances', {
          p_tenant_id: tenantId,
          p_status: 'all',
          p_folio_id: folioId
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      // Map the response to FolioBalance format
      const balance: FolioBalance = {
        folio_id: data[0].folio_id,
        folio_number: data[0].folio_number,
        reservation_id: data[0].reservation_id,
        guest_name: data[0].guest_name,
        room_number: data[0].room_number,
        total_charges: data[0].total_charges,
        total_payments: data[0].total_payments,
        balance: data[0].balance,
        status: data[0].balance > 0 ? 'outstanding' : 'paid'
      };

      return balance;
    } catch (err) {
      console.error('Error loading folio balance:', err);
      throw err;
    }
  };

  const loadPayments = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payment_method_id,
          folios!inner(
            folio_number,
            reservations!inner(
              guest_name,
              rooms!reservations_room_id_fkey(room_number)
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
    payment_method_id?: string;
    reference?: string;
    // Phase 3: Department/Terminal tracking
    department_id?: string;
    terminal_id?: string;
    payment_source?: 'frontdesk' | 'restaurant' | 'bar' | 'gym' | 'spa' | 'laundry' | 'other';
  }) => {
    if (!tenant?.tenant_id) return null;

    try {
      // Get current user ID for duplicate check
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userId = currentUser?.id;

      // PHASE 2: Improved duplicate detection - 10 second window with method and user check
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('folio_id', paymentData.folio_id)
        .eq('amount', paymentData.amount)
        .gte('created_at', new Date(Date.now() - 10000).toISOString()) // 10 seconds
        .eq('status', 'completed');

      if (recentPayments && recentPayments.length > 0) {
        // Additional intelligent checks
        const isDuplicate = recentPayments.some(p => 
          Math.abs(p.amount - paymentData.amount) < 0.01 &&
          (paymentData.payment_method_id ? p.payment_method_id === paymentData.payment_method_id : true) &&
          (userId ? p.processed_by === userId : true)
        );
        
        if (isDuplicate) {
          throw new Error('Duplicate payment detected. A payment of this amount was just processed.');
        }
      }

      // Phase 1: Enhanced client-side validation
      const { validatePaymentData, parsePaymentError } = await import('@/lib/payment-validation');
      
      const validation = validatePaymentData({
        amount: paymentData.amount,
        paymentMethod: paymentData.payment_method,
        paymentMethodId: paymentData.payment_method_id,
        folioId: paymentData.folio_id,
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Payment validation failed');
      }

      // Additional check: Verify payment method is enabled if payment_method_id provided
      if (paymentData.payment_method_id) {
        const { data: method } = await supabase
          .from('payment_methods')
          .select('enabled, name, type')
          .eq('id', paymentData.payment_method_id)
          .eq('tenant_id', tenant.tenant_id)
          .single();

        if (!method) {
          throw new Error('Payment method not found');
        }

        if (!method.enabled) {
          throw new Error(`${method.name} is currently disabled. Please select another payment method.`);
        }
      }

      // CRITICAL: Map payment method to canonical value
      const { mapToCanonicalPaymentMethod } = await import('@/lib/payment-method-mapper');
      
      let normalizedMethod: string;
      try {
        normalizedMethod = mapToCanonicalPaymentMethod(paymentData.payment_method);
        console.log('[Payment] Mapped payment method:', {
          original: paymentData.payment_method,
          canonical: normalizedMethod
        });
      } catch (mappingError) {
        console.error('[Payment] Mapping error:', {
          provided: paymentData.payment_method,
          error: mappingError
        });
        throw mappingError;
      }

      console.log('[Payment] Creating payment with validated canonical method:', {
        amount: paymentData.amount,
        method: normalizedMethod,
        methodId: paymentData.payment_method_id,
        folioId: paymentData.folio_id,
        departmentId: paymentData.department_id,
        terminalId: paymentData.terminal_id,
        paymentSource: paymentData.payment_source
      });

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          payment_method: normalizedMethod,
          tenant_id: tenant.tenant_id,
          status: 'completed',
          // Phase 3: Include department and terminal tracking
          department_id: paymentData.department_id || null,
          terminal_id: paymentData.terminal_id || null,
          payment_source: paymentData.payment_source || 'frontdesk',
          payment_status: 'paid',
          is_verified: true,
          verified_by: (await supabase.auth.getUser()).data.user?.id || null,
          verified_at: new Date().toISOString(),
          gross_amount: paymentData.amount,
          fee_amount: 0,
          net_amount: paymentData.amount
        })
        .select()
        .single();

      if (error) {
        const userMessage = parsePaymentError(error);
        console.error('[Payment] Server error:', error);
        throw new Error(userMessage);
      }

      console.log('[Payment] Payment created successfully:', data?.id);

      // Aggressive refresh to ensure UI updates
      await Promise.all([
        loadBillingStats(), 
        loadFolioBalances(), 
        loadPayments(),
        queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] }),
        queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] }),
        queryClient.invalidateQueries({ queryKey: ['payments', tenant.tenant_id] }),
        queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] })
      ]);
      
      return data;
    } catch (err) {
      console.error('[Payment] Error creating payment:', err);
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
    getFolioBalance,
    refresh
  };
}