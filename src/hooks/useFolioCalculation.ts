// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { timeout } from '@/lib/timeout';

/**
 * PHASE 3: Centralized Folio Calculation Hook
 * Single source of truth for all billing displays
 * 
 * This hook provides:
 * - Consistent folio balance calculations across all UI components
 * - Proper handling of overpaid/negative balances
 * - Unified data structure for charges, payments, and tax breakdowns
 * - Real-time updates with React Query caching
 */

export interface FolioCharge {
  id: string;
  charge_type: string;
  description: string;
  base_amount: number;
  service_charge_amount: number;
  vat_amount: number;
  amount: number;
  created_at: string;
}

export interface FolioPayment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  processed_by: string;
}

export interface TaxBreakdown {
  subtotal: number;
  service_charge: number;
  vat: number;
  total: number;
}

export interface FolioCalculationResult {
  folioId: string;
  folioNumber: string;
  reservationId: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  creditAmount: number;
  chargeBreakdown: FolioCharge[];
  paymentBreakdown: FolioPayment[];
  taxBreakdown: TaxBreakdown;
}

/**
 * Hook to fetch and calculate folio data from the database
 * Uses the get_folio_with_breakdown RPC function for consistency
 */
export function useFolioCalculation(folioId: string | null | undefined) {
  return useQuery({
    queryKey: ['folio-calculation', folioId],
    queryFn: async (): Promise<FolioCalculationResult | null> => {
      if (!folioId) {
        console.log('[useFolioCalculation] No folioId provided');
        return null;
      }

      console.log('[🔍 FolioCalculation] Fetching folio breakdown for:', folioId);
      const startTime = Date.now();
      
      // Add timeout wrapper to prevent indefinite loading
      const folioPromise = supabase.rpc('get_folio_with_breakdown', { p_folio_id: folioId });

      try {
        const { data, error } = await Promise.race([
          folioPromise,
          new Promise<{ data: null; error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error('Folio fetch timeout - taking too long')), 15000)
          )
        ]);

        const fetchTime = Date.now() - startTime;
        console.log('[⏱️ FolioCalculation] RPC completed in:', fetchTime, 'ms');

        if (error) {
          console.error('[❌ FolioCalculation] Error fetching folio:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn('[⚠️ FolioCalculation] No folio data returned for ID:', folioId);
          return null;
        }
        
        console.log('[✅ FolioCalculation] Folio data loaded:', {
          folioNumber: data[0].folio_number,
          balance: data[0].balance,
          chargesCount: Array.isArray(data[0].charges) ? data[0].charges.length : 0,
          paymentsCount: Array.isArray(data[0].payments) ? data[0].payments.length : 0
        });

        const folio = data[0];

        // Calculate payment status from balance
        const getPaymentStatus = (balance: number): 'paid' | 'partial' | 'unpaid' | 'overpaid' => {
          if (Math.abs(balance) < 0.01) return 'paid';
          if (balance < 0) return 'overpaid';
          if (balance > 0 && Array.isArray(folio.payments) && folio.payments.length > 0) return 'partial';
          return 'unpaid';
        };

        return {
          folioId: folio.folio_id,
          folioNumber: folio.folio_number,
          reservationId: folio.reservation_id,
          totalCharges: folio.total_charges,
          totalPayments: folio.total_payments,
          balance: folio.balance,
          status: getPaymentStatus(folio.balance),
          creditAmount: folio.balance < 0 ? Math.abs(folio.balance) : 0,
          chargeBreakdown: (folio.charges as unknown) as FolioCharge[],
          paymentBreakdown: (folio.payments as unknown) as FolioPayment[],
          taxBreakdown: {
            subtotal: folio.total_charges,
            service_charge: 0,
            vat: 0,
            total: folio.total_charges
          } as TaxBreakdown
        };
      } catch (err) {
        if (err instanceof Error && err.message.includes('timeout')) {
          console.error('[⏰ FolioCalculation] Query timeout after 15s');
          throw new Error('Unable to load folio - request timed out. Please try again.');
        }
        throw err;
      }
    },
    enabled: !!folioId,
    staleTime: 0, // G++.1: Always fresh for billing accuracy
    gcTime: 60_000, // G++.1: 1 minute cache
    refetchOnMount: 'always', // PRIORITY 4 FIX: Force fresh fetch on every mount
    refetchOnWindowFocus: true, // G++.4: PHASE 1 - Refetch on tab return for fresh billing data
    refetchOnReconnect: true, // PRIORITY 4 FIX: Refetch on network reconnection
    retry: 3, // More retries for better resilience
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Helper function to format currency consistently
 */
export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Helper function to get payment status display text
 */
export const getPaymentStatusLabel = (status: FolioCalculationResult['status']): string => {
  switch (status) {
    case 'paid':
      return 'Fully Paid';
    case 'overpaid':
      return 'Overpaid';
    case 'partial':
      return 'Partial Payment';
    case 'unpaid':
      return 'Unpaid';
    default:
      return 'Unknown';
  }
};

/**
 * Helper function to determine if checkout is allowed
 */
export const canCheckout = (balance: number): boolean => {
  // Allow checkout if balance is 0 or negative (paid/overpaid)
  // Tolerance of ₦0.01 for rounding
  return balance <= 0.01;
};
